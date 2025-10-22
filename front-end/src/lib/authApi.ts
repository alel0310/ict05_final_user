// src/lib/authApi.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { tokenStorage } from "./tokenStorage";

const USE_PROXY = true;              // ✅ 프록시 사용
const BASE = USE_PROXY ? "/api" : "http://localhost:8082/user";

const api: AxiosInstance = axios.create({
  baseURL: BASE,          // ✅ 컴포넌트에서는 "/login", "/auth/refresh" 등만 쓰면 됨
  withCredentials: true,  // 쿠키 쓰면 true. JWT만 쓰면 false로 바꿔도 무방
  timeout: 15000,
});

let forceLogout: (() => void) | null = null;
export const setForceLogoutHandler = (fn: () => void) => {
  forceLogout = fn;
};

api.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess();
  if (access) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let isRefreshing = false;
let requestQueue: ((token: string) => void)[] = [];

const runQueuedRequests = (token: string) => {
  requestQueue.forEach((cb) => cb(token));
  requestQueue = [];
};

const enqueueRequest = (cb: (token: string) => void) => {
  requestQueue.push(cb);
};

async function refreshTokens() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("NO_REFRESH");

  const { data } = await axios.post(
    `${BASE}/auth/refresh`,   // ✅ 프록시가 /user/auth/refresh 로 전달
    { refreshToken: refresh },
    { withCredentials: true }
  );

  const newAccess: string = data.accessToken;
  const newRefresh: string = data.refreshToken ?? refresh;
  if (!newAccess) throw new Error("INVALID_REFRESH_RESPONSE");

  tokenStorage.setTokens({ accessToken: newAccess, refreshToken: newRefresh });
  return newAccess;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          enqueueRequest((newToken: string) => {
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            original._retry = true;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshTokens();
        runQueuedRequests(newToken);
        original.headers = original.headers || {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        tokenStorage.clear();
        runQueuedRequests("");
        if (forceLogout) forceLogout();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
