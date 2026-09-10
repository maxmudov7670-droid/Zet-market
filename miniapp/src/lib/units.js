// Mahsulotlar ikki xil o'lchamda sotiladi: "dona" (butun sonlarda) yoki
// "kg"/"litr" (kasr sonlarda, 0.5 qadam bilan). Server bu qoidani
// backend/src/lib/units.js orqali qayta tekshiradi — bu yerdagi mantiq
// faqat tezkor, qulay interfeys uchun.

const UNIT_LABELS = {
  dona: "dona",
  kg: "kg",
  litr: "litr",
};

export function unitLabel(unit) {
  return UNIT_LABELS[unit] || unit || "dona";
}

export function isWeightUnit(unit) {
  return unit === "kg" || unit === "litr";
}

export function qtyStep(unit) {
  return isWeightUnit(unit) ? 0.5 : 1;
}

export function qtyBounds(unit) {
  return isWeightUnit(unit) ? { min: 0.5, max: 50 } : { min: 1, max: 99 };
}

export function clampQty(qty, unit) {
  const step = qtyStep(unit);
  const { min, max } = qtyBounds(unit);
  const num = Number(qty);
  const safe = Number.isFinite(num) && num > 0 ? num : min;
  const rounded = Math.round(safe / step) * step;
  return Number(Math.max(min, Math.min(max, rounded)).toFixed(2));
}

// "1.5 kg" yoki "3 dona" kabi ko'rinishda formatlaydi
export function formatQty(qty, unit) {
  const n = Number(qty) || 0;
  const num = isWeightUnit(unit) ? String(n.toFixed(1)).replace(/\.0$/, "") : String(Math.round(n));
  return `${num} ${unitLabel(unit)}`;
}
