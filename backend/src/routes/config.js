const express = require("express");
const { isClickConfigured, isPaymeConfigured } = require("../lib/paymentLinks");

const router = express.Router();

// GET /api/config — Mini App shu orqali qaysi to'lov usullari hozir faolligini
// bilib oladi (Click/Payme merchant ma'lumotlari kiritilgach, kodni
// o'zgartirmasdan — faqat Render'da muhit o'zgaruvchisi qo'shib — avtomatik yoqiladi).
router.get("/", (req, res) => {
  res.json({
    cash: true,
    click: isClickConfigured(),
    payme: isPaymeConfigured(),
  });
});

module.exports = router;
