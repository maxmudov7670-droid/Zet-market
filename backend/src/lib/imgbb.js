// Admin Panelda mahsulot rasmini galereyadan yuklash uchun ImgBB (bepul,
// kredit karta yoki biznes ma'lumoti so'ramaydigan xizmat) ishlatiladi —
// Render'ning bepul serverlari qayta ishga tushganda diskdagi fayllarni
// yo'qotib qo'yadi, shuning uchun rasmlar alohida, doimiy xizmatda
// saqlanishi kerak.
function isImgbbConfigured() {
  return Boolean(process.env.IMGBB_API_KEY);
}

module.exports = { isImgbbConfigured };
