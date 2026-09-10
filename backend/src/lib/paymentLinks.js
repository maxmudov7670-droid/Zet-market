// Click va Payme uchun to'lov manzillarini (checkout link) yasovchi
// yordamchi funksiyalar. Ikkalasi ham merchant ID/kalitlar sozlanmaguncha
// "faol emas" hisoblanadi — shunda mijozga ko'rsatilmaydi (config.js orqali).

function isClickConfigured() {
  return Boolean(
    process.env.CLICK_MERCHANT_ID && process.env.CLICK_SERVICE_ID && process.env.CLICK_SECRET_KEY
  );
}

function isPaymeConfigured() {
  return Boolean(process.env.PAYME_MERCHANT_ID && process.env.PAYME_KEY);
}

// Click checkout havolasi — mijoz shu manzilga o'tib to'lovni yakunlaydi.
// https://docs.click.uz — "Click orqali to'lov" (Checkout) havolasi.
function buildClickUrl(order) {
  const params = new URLSearchParams({
    service_id: process.env.CLICK_SERVICE_ID,
    merchant_id: process.env.CLICK_MERCHANT_ID,
    amount: String(order.totalPrice),
    transaction_param: String(order.id), // merchant_trans_id sifatida qaytadi
  });
  if (process.env.MINIAPP_URL) {
    params.set("return_url", process.env.MINIAPP_URL);
  }
  return `https://my.click.uz/services/pay?${params.toString()}`;
}

// Payme checkout havolasi — parametrlar base64 qilinib URL yo'liga qo'shiladi.
// https://developer.help.paycom.uz — "Checkout" hujjati.
// PAYME_TEST_MODE=true bo'lsa — sinov (sandbox) domeniga yo'naltiradi, bu
// biznes hali Payme tomonidan tasdiqlanmagan bo'lsa ham butun oqimni
// (checkout -> webhook -> buyurtma holati) sinab ko'rish imkonini beradi.
function buildPaymeUrl(order) {
  const amountTiyin = order.totalPrice * 100; // Payme summani tiyinda kutadi
  const raw = `m=${process.env.PAYME_MERCHANT_ID};ac.order_id=${order.id};a=${amountTiyin}`;
  const encoded = Buffer.from(raw).toString("base64");
  const host = process.env.PAYME_TEST_MODE === "true" ? "test.paycom.uz" : "checkout.paycom.uz";
  return `https://${host}/${encoded}`;
}

function buildPaymentUrl(method, order) {
  if (method === "click") return buildClickUrl(order);
  if (method === "payme") return buildPaymeUrl(order);
  return null;
}

module.exports = { isClickConfigured, isPaymeConfigured, buildPaymentUrl };
