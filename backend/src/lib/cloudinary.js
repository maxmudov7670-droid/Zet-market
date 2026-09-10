const cloudinary = require("cloudinary").v2;

// Admin Panelda mahsulot rasmini galereyadan yuklash uchun Cloudinary
// (bepul tarif) ishlatiladi — Render'ning bepul serverlari qayta ishga
// tushganda diskdagi fayllarni yo'qotib qo'yadi, shuning uchun rasmlar
// alohida, doimiy xizmatda saqlanishi kerak.
function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

module.exports = { cloudinary, isCloudinaryConfigured };
