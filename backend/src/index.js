require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { bot } = require("./bot/bot");
const productsRouter = require("./routes/products");
const usersRouter = require("./routes/users");
const ordersRouter = require("./routes/orders");
const configRouter = require("./routes/config");
const adminRouter = require("./routes/admin");
const paymentsRouter = require("./routes/payments");
const homeStoriesRouter = require("./routes/homeStories");
const uploadRouter = require("./routes/upload");

const app = express();

app.use(
  cors({
    origin: true, // localhost admin panel + ngrok orqali ochilgan mini app uchun ruxsat
  })
);
app.use(express.json());

// Render.com kabi doimiy (bulutli) muhitda ishlayotganini aniqlaymiz.
// Render har bir web service uchun avtomatik RENDER_EXTERNAL_URL beradi.
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || null;
const WEBHOOK_PATH = `/telegraf/${process.env.BOT_TOKEN}`;

if (PUBLIC_URL) {
  // Bulutda: webhook rejimi ishlatiladi, chunki bepul tarifda server
  // faolsizlikdan keyin "uxlab qoladi" — webhook kelgan so'rov orqali uni
  // uyg'otadi, uzluksiz polling esa uxlab qolgan serverda ishlamay qoladi.
  // MUHIM: bu boshqa yo'llardan (va 404 ushlagichdan) OLDIN ro'yxatga
  // olinishi shart, aks holda so'rov hech qachon shu yerga yetib bormaydi.
  app.use(bot.webhookCallback(WEBHOOK_PATH));
}

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "zet-market-backend" });
});

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/config", configRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/stories", homeStoriesRouter);
app.use("/api/upload", uploadRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Topilmadi" });
});

// Umumiy xatoliklar uchun
app.use((err, req, res, next) => {
  console.error("Kutilmagan xatolik:", err);
  res.status(500).json({ error: "Server xatoligi" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  if (!process.env.BOT_TOKEN) {
    console.error("BOT_TOKEN topilmadi! .env faylini tekshiring.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL topilmadi! .env faylini tekshiring.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Backend API ${PORT}-portda ishga tushdi`);
  });

  if (PUBLIC_URL) {
    await bot.telegram.setWebhook(`${PUBLIC_URL}${WEBHOOK_PATH}`);
    console.log(`✅ Telegram bot webhook rejimida ishga tushdi: ${PUBLIC_URL}${WEBHOOK_PATH}`);
  } else {
    // Mahalliy kompyuterda (localhost) ishlaganda oddiy polling rejimi ishlatiladi.
    // Avvalgi webhook (agar bo'lsa) tozalanadi, aks holda polling xato beradi.
    await bot.telegram.deleteWebhook({ drop_pending_updates: false });
    await bot.launch();
    console.log("✅ Telegram bot ishga tushdi (polling rejimida)");
  }
}

start();

// Botni to'g'ri to'xtatish (Ctrl+C bosilganda)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
