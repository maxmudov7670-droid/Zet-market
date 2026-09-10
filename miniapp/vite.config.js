import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // tunnel orqali tashqaridan ochilishi uchun
    allowedHosts: true, // tunnel domenlaridan kelgan so'rovlarni bloklamasligi uchun
    proxy: {
      // Telefonda "localhost:4000" telefonning o'zini anglatadi, backend'ni emas —
      // shuning uchun /api so'rovlarini shu Vite server ichida backend'ga yo'naltiramiz.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
