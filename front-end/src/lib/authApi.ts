import axios from "axios";

// ✅ 토큰 저장 위치 (예시: localStorage)
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// ✅ axios 인스턴스 생성
const api = axios.create({
  baseURL: "http://localhost8080/api", //백엔드 api url
  withCredentials: true,
  headers: {"Content-Type": "application/json"},
});

// ✅ 요청 인터셉터 : accessToken 자동 첨부
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if(token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터 : 401 발생 시 자동 토큰 재발급
api.interceptors.response.use(
  (response) => response, //정상응답은 그대로 통과
  async (error) => {
    const originalRequest = error.config;

    // ❌ accessToken 만료 시 처리
    if(error.response && error.response.status === 401 && !originalRequest._retry){
      originalRequest._retry = true;  // 무한루프 방지

      try {
        // refreshToken 가져오기
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if(!refreshToken) throw new Error("No refresh token");

        // 🔄 refresh 요청
        const res = await axios.post("http://localhost:8080/api/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        // 새 토큰 저장
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
        if (newRefreshToken){
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        // Authorization 헤더 갱신 후 재요청
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError){
        console.error("🔒 Token refresh failed:", refreshError);

        // 로그인 만료 처리
        localStorage.removeItem(ACCESS_TOKEN_KEY);

        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href="/login";  //로그인 페이지로 이동
      }
    }
    return Promise.reject(error);
  }
);

export default api;