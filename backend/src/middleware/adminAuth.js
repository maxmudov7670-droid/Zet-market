// Admin Panel endi internetda ochiq (Render'da) turgani uchun,
// admin buyurtma/mahsulot endpointlarini oddiy parol bilan himoyalaymiz.
// Admin Panel har bir so'rovga "x-admin-password" headerini qo'shib yuboradi.
function requireAdminAuth(req, res, next) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    // ADMIN_PASSWORD sozlanmagan bo'lsa, xavfsizlik uchun kirishni butunlay yopamiz
    // (ochiq holatda qoldirib qo'yish xavfli, chunki panel endi hammaga ko'rinadi).
    return res.status(503).json({ error: "Admin panel hali sozlanmagan (ADMIN_PASSWORD yo'q)" });
  }

  const provided = req.header("x-admin-password");
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Noto'g'ri parol" });
  }

  next();
}

module.exports = { requireAdminAuth };
