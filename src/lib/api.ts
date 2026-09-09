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
        if (typeof config.headers.set === 'function') {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('root_jwt_token');
        localStorage.removeItem('root_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
