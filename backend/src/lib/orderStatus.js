// Buyurtma holatlari uchun o'zbekcha matnlar — Admin Panel va bot bir xil
// matndan foydalanishi uchun shu yerda markazlashtirilgan.

const STATUS_LABELS_UZ = {
  PENDING: "Kutilmoqda",
  PREPARING: "Yig'ilmoqda",
  DELIVERING: "Yetkazilmoqda",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
};

// Mijozga holat o'zgarganda yuboriladigan xabar matnlari.
// PENDING uchun xabar yo'q — bu buyurtma yaratilgan zahoti allaqachon
// notifyOrderConfirmed orqali alohida xabar yuboriladi.
const STATUS_MESSAGES_UZ = {
  PREPARING: (orderId) => `📦 Buyurtmangiz #${orderId} yig'ilmoqda!`,
  DELIVERING: (orderId) =>
    `🛵 Buyurtmangiz #${orderId} yo'lda! Kuryerimiz tez orada sizga yetib boradi.`,
  DELIVERED: (orderId) =>
    `🎉 Buyurtmangiz #${orderId} yetkazildi.\n\nXizmatimizdan foydalanganingiz uchun rahmat 🛒`,
  CANCELLED: (orderId) =>
    `❌ Afsuski, buyurtmangiz #${orderId} bekor qilindi. Savollar uchun biz bilan bog'laning.`,
};

const PAYMENT_METHOD_LABELS_UZ = {
  cash: "Naqd (yetkazib berishda)",
  click: "Click",
  payme: "Payme",
};

const PAYMENT_STATUS_LABELS_UZ = {
  pending: "To'lov kutilmoqda",
  paid: "To'langan",
  failed: "To'lov amalga oshmadi",
};

module.exports = {
  STATUS_LABELS_UZ,
  STATUS_MESSAGES_UZ,
  PAYMENT_METHOD_LABELS_UZ,
  PAYMENT_STATUS_LABELS_UZ,
};
