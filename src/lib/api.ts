import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  process.env.BACKEND_PUBLIC_API_URL ||
  "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

console.log("Axios baseURL configured as:", api.defaults.baseURL);
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("root_jwt_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
