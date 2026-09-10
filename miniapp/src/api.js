import axios from "axios";

// Bo'sh qoldirilsa (tavsiya etiladi), so'rovlar joriy sahifa manzili (tunnel yoki localhost)
// ustidan nisbiy "/api" yo'liga boradi va Vite proxy orqali backend'ga yetadi —
// bu telefon va kompyuterda bir xil ishlaydi.
const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Har bir so'rovga Telegram initData'ni qo'shib yuboramiz —
// backend shu orqali foydalanuvchini xavfsiz tanib oladi.
api.interceptors.request.use((config) => {
  const initData = window.Telegram?.WebApp?.initData || "";
  config.headers["X-Telegram-Init-Data"] = initData;
  return config;
});

export function getTelegramUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

export default api;
