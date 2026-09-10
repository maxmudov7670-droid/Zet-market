const express = require("express");

const router = express.Router();

// POST /api/admin/login — Admin Panel parolni shu orqali tekshiradi.
// To'g'ri bo'lsa, Admin Panel shu parolni saqlab, keyingi barcha so'rovlarga
// "x-admin-password" header sifatida qo'shib yuboradi (requireAdminAuth shuni tekshiradi).
router.post("/login", (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return res.status(503).json({ error: "Admin panel hali sozlanmagan (ADMIN_PASSWORD yo'q)" });
  }
  const { password } = req.body;
  if (password !== expected) {
    return res.status(401).json({ error: "Noto'g'ri parol" });
  }
  res.json({ ok: true });
});

module.exports = router;
