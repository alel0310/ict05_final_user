// src/lib/authApi.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { tokenStorage } from "./tokenStorage";

const USE_PROXY = true;             // 프록시 사용
const BASE = USE_PROXY ? "/api" : "http://localhost:8082/user";
const REFRESH_PATH = "/jwt/refresh"; // ✅ 백엔드와 동일하게!

const api: AxiosInstance = axios.create({
  baseURL: BASE,
  withCredentials: true,
  timeout: 15000,
});

let forceLogout: (() => void) | null = null;
export const setForceLogoutHandler = (fn: () => void) => { forceLogout = fn; };

api.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess();
  if (access) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let isRefreshing = false;
let queue: ((t: string) => void)[] = [];
const flush = (t: string) => { queue.forEach(cb => cb(t)); queue = []; };

async function refreshTokens() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error("NO_REFRESH");

  // ✅ /api/jwt/refresh -> 프록시가 /user/jwt/refresh로 전달
  const { data } = await axios.post(
    `${BASE}${REFRESH_PATH}`,
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
          queue.push((newToken) => {
            original.headers = original.headers || {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            original._retry = true;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      original._retry = true;
      try {
        const newToken = await refreshTokens();
        flush(newToken);
        original.headers = original.headers || {};
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        tokenStorage.clear();
        flush("");
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
