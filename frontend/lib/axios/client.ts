import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes("/auth/");

    if (status === 401 && !isAuthRoute) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
