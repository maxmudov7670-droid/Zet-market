// Mahsulotlar ikki xil o'lchamda sotiladi: "dona" (butun sonlarda — 1, 2, 3 ...)
// yoki "kg"/"litr" (kasr sonlarda, 0.5 qadam bilan — 0.5, 1, 1.5 ...).
// Bu yordamchi funksiyalar shu qoidani markazlashtiradi — Mini App ham,
// backend ham (xavfsizlik uchun serverda qayta tekshiriladi) shu yerdan
// foydalanadi.

const WEIGHT_UNITS = new Set(["kg", "litr"]);

function isWeightUnit(unit) {
  return WEIGHT_UNITS.has(unit);
}

function qtyStep(unit) {
  return isWeightUnit(unit) ? 0.5 : 1;
}

function qtyBounds(unit) {
  return isWeightUnit(unit) ? { min: 0.5, max: 50 } : { min: 1, max: 99 };
}

// Mijozdan kelgan miqdorni HAR DOIM shu funksiya orqali "tozalaymiz" —
// hech qachon frontenddan kelgan qty'ga to'g'ridan-to'g'ri ishonmaymiz.
function clampQty(qty, unit) {
  const step = qtyStep(unit);
  const { min, max } = qtyBounds(unit);
  const num = Number(qty);
  const safe = Number.isFinite(num) && num > 0 ? num : min;
  const rounded = Math.round(safe / step) * step;
  return Number(Math.max(min, Math.min(max, rounded)).toFixed(2));
}

module.exports = { isWeightUnit, qtyStep, qtyBounds, clampQty };
