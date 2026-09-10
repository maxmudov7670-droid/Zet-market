# Zet Market — Mahalla Oziq-ovqat Do'koni Yetkazib Berish

Telegram Mini App + Admin Panel + Bot (Node.js, React, Prisma, PostgreSQL).
Mahsulotlar "dona" (butun sonlarda) yoki "kg"/"litr" (kasr sonlarda) o'lchovida sotiladi.

## Tuzilma

- `backend/` — Node.js + Express API + Telegram bot (Telegraf) + Prisma ORM
- `miniapp/` — Mijozlar uchun Telegram Mini App (React + Vite + Tailwind)
- `admin/` — Ma'murlar uchun Admin Panel (React + Vite + Tailwind)

To'liq ishga tushirish bo'yicha qadam-baqadam qo'llanma suhbatning oxirida berilgan.

## Tezkor buyruqlar

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev

# Mini App (yangi terminalda)
cd miniapp
npm install
npm run dev

# Admin Panel (yana bir terminalda)
cd admin
npm install
npm run dev
```

Admin Panel: http://localhost:5174
Mini App (localhost preview): http://localhost:5173 — lekin Telegram ichida ishlashi uchun ngrok kerak (qo'llanmaga qarang).
