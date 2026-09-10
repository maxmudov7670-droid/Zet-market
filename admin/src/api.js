import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Har bir so'rovga saqlangan admin parolini qo'shib yuboramiz
api.interceptors.request.use((config) => {
  const password = localStorage.getItem("admin_password");
  if (password) {
    config.headers["x-admin-password"] = password;
  }
  return config;
});

// Parol noto'g'ri/eskirgan bo'lsa — tozalab, login sahifasiga qaytaramiz
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("admin_password");
      if (location.pathname !== "/login") {
        location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
