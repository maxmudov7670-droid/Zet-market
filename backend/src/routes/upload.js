const express = require("express");
const multer = require("multer");
const axios = require("axios");
const { requireAdminAuth } = require("../middleware/adminAuth");
const { isImgbbConfigured } = require("../lib/imgbb");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(), // diskga yozmaymiz — Render qayta ishga tushganda yo'qolib ketardi
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Faqat rasm fayllari qabul qilinadi"));
    }
    cb(null, true);
  },
});

// POST /api/upload — Admin Panel: mahsulot rasmini telefon/kompyuter
// galereyasidan tanlab yuklash. Rasm ImgBB'ga (doimiy, bepul xizmat,
// ro'yxatdan o'tish uchun kredit karta so'ramaydi) saqlanadi va uning ochiq
// havolasi qaytariladi — shu havola keyin Product.imageUrl sifatida saqlanadi.
router.post("/", requireAdminAuth, (req, res) => {
  if (!isImgbbConfigured()) {
    return res.status(503).json({
      error: "Rasm yuklash hali sozlanmagan. Render'da IMGBB_API_KEY o'zgaruvchisini qo'shing.",
    });
  }

  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Faylni o'qishda xatolik" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Rasm tanlanmadi" });
    }

    try {
      const params = new URLSearchParams();
      params.append("image", req.file.buffer.toString("base64"));

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        params
      );

      const url = response.data?.data?.url;
      if (!url) {
        throw new Error("ImgBB javobida rasm havolasi topilmadi");
      }
      res.json({ url });
    } catch (uploadErr) {
      console.error(
        "ImgBB'ga yuklashda xatolik:",
        uploadErr?.response?.data || uploadErr.message
      );
      res.status(500).json({ error: "Rasmni yuklashda xatolik" });
    }
  });
});

module.exports = router;
