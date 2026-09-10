const express = require("express");
const multer = require("multer");
const { requireAdminAuth } = require("../middleware/adminAuth");
const { cloudinary, isCloudinaryConfigured } = require("../lib/cloudinary");

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
// galereyasidan tanlab yuklash. Rasm Cloudinary'ga (doimiy, bepul xizmat)
// saqlanadi va uning ochiq havolasi qaytariladi — shu havola keyin
// Product.imageUrl sifatida saqlanadi.
router.post("/", requireAdminAuth, (req, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      error:
        "Rasm yuklash hali sozlanmagan. Render'da CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET o'zgaruvchilarini qo'shing.",
    });
  }

  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Faylni o'qishda xatolik" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Rasm tanlanmadi" });
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "zet-market/products" },
      (uploadErr, result) => {
        if (uploadErr) {
          console.error("Cloudinary'ga yuklashda xatolik:", uploadErr);
          return res.status(500).json({ error: "Rasmni yuklashda xatolik" });
        }
        res.json({ url: result.secure_url });
      }
    );
    stream.end(req.file.buffer);
  });
});

module.exports = router;
