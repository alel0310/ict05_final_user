// src/lib/authApi.js
import axios from 'axios';
import { tokenStorage } from './tokenStorage';

// .env: REACT_APP_BACKEND_API_BASE_URL=http://localhost:8081 (예시)
const BASE_URL = process.env.REACT_APP_BACKEND_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 서버가 쿠키도 같이 쓰면 유지 (안 쓰면 남겨도 무방)
  timeout: 20000,
});



// ====== refresh 중복 호출 방지 ======
let isRefreshing = false;
let refreshQueue = []; // { resolve, reject, config }

function onRefreshed(newAccessToken) {
  refreshQueue.forEach(({ resolve }) => resolve(newAccessToken));
  refreshQueue = [];
}
function onRefreshFailed(error) {
  refreshQueue.forEach(({ reject }) => reject(error));
  refreshQueue = [];
}

// ====== AccessToken 첨부 ======
api.interceptors.request.use(   // t2. 이거가 먼저 실행 
  (config) => {
    const access = tokenStorage.getAccess();    // t3. 이거로 accessToken을 가져와서 
    if (access) {
      config.headers['Authorization'] = `Bearer ${access}`; // t4. 헤더에 붙여줌
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ====== 401 처리 ======
api.interceptors.response.use(    // t5. access토근이 만료되면 여기로 응답이 들어감
  (res) => res,
  async (error) => {
    const original = error.config;

    // 네트워크 에러 등은 그대로
    if (!error.response) return Promise.reject(error);

    const { status } = error.response;

    // 이미 한 번 재시도한 요청이면 더 이상 반복 안 함
    if (status === 401 && !original._retry) {   // t6. 여기서 동일 요청이 무한 루프 되지 않게 
      original._retry = true;     // t7. 이거를 통해 막기

      const refreshToken = tokenStorage.getRefresh();   // t8. 여기서 refreshtoken을 꺼냄
      if (!refreshToken) {
        tokenStorage.clear();   // t9. 없으면 스토리지를 비우고 
        // 새로고침/로그인 이동은 라우터가 있는 곳에서 처리 권장
        window.location.replace('/login');    // t10. /login으로 보냄
        return Promise.reject(error);
      }

      // 이미 refresh 중이면 큐에 붙어서 refresh 완료 후 재시도
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({   // t11. 이미 다른 요청이 갱신 중이면 refreshQueue에 콜백을 넣고 대기
            resolve: (newAccess) => {
              original.headers['Authorization'] = `Bearer ${newAccess}`;
              resolve(api(original));
            },
            reject: (err) => reject(err),
            config: original,
          });
        });
      }

      // refresh 시작
      isRefreshing = true;    // t12. 아니면 true 로 바꾸고 리프레시 요청을 시작함

      try {
        // ✅ 요구사항: "헤더에 refresh 토큰을 담아서" 전송
        const resp = await axios.post(  // t13. 코드에서 이렇게 보냄
          `${BASE_URL}/jwt/refresh`,
          null, // 바디 없이
          {
            withCredentials: true,
            headers: { 'X-Refresh-Token': refreshToken }, // ✅ 헤더로 보냄
          } // t14. 서버는 x-refresh-token 헤더를 읽어서 새 accesstoken(필요하면 refreshtoken도)응답해줌
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = resp.data || {};

        if (!newAccessToken) {
          throw new Error('No accessToken in refresh response');
        }

        // 로컬 저장소 업데이트
        tokenStorage.setTokens({  // t15. 응답에서(선택적으로 newrefreshtoken)을 꺼내서
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || refreshToken, // t16. 새 refresh 없으면 기존 유지
        });

        // 대기 중인 요청들 처리
        onRefreshed(newAccessToken);  // t17. 호출해서 refreshqueue에 대기중인 모든 요청에게 새 토큰을 전달

        // 현재 요청 헤더도 교체해서 재시도 // t18. 방금 401났던 요청의 헤더를 새 토큰으로 교체함
        original.headers['Authorization'] = `Bearer ${newAccessToken}`; 
        
        // t19. 그래서 최종적으로
        // 1. /user -> 401
        // 2. /jwt/refresh -> 200
        // 3. /user(재시도) -> 200 이거 때문에 200은 두번임 

        return api(original);
      } catch (e) {
        onRefreshFailed(e);
        tokenStorage.clear();
        window.location.replace('/login');
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // 그 외 에러는 그대로
    return Promise.reject(error);
  }
);

export default api;
