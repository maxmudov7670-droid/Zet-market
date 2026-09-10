import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "./ProductCard.jsx";
import { clampQty, formatQty, qtyBounds, qtyStep, unitLabel } from "../lib/units.js";

export default function ProductSheet({ product, onClose }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  // Har safar boshqa mahsulot ochilganda, miqdorni o'sha mahsulotning
  // o'lchamiga mos boshlang'ich qiymatga qaytaramiz (masalan kg uchun 0.5).
  useEffect(() => {
    if (product) setQty(qtyBounds(product.unit).min);
  }, [product?.id]);

  if (!product) return null;

  const step = qtyStep(product.unit);

  const ingredients = (product.description || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  function handleAdd() {
    addItem(product, qty);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* fon */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* bottom sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl overflow-hidden max-h-[88vh] flex flex-col animate-[slideUp_0.25s_ease-out]">
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mt-3" />

        <div className="overflow-y-auto no-scrollbar pb-4">
          <div className="aspect-[4/3] bg-gray-50">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🛒</div>
            )}
          </div>

          <div className="px-5 pt-4">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <div className="flex items-baseline gap-2 mt-1">
              {product.oldPrice && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
              )}
              <span className="text-base font-bold text-brand">
                {formatPrice(product.newPrice)}
                <span className="text-gray-400 font-normal text-sm"> / {unitLabel(product.unit)}</span>
              </span>
            </div>

            {ingredients.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Tarkibi</p>
                <ul className="space-y-1.5">
                  {ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-center gap-5 mt-6">
              <button
                onClick={() => setQty((q) => clampQty(q - step, product.unit))}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 text-lg font-bold flex items-center justify-center active:scale-90 transition-transform"
              >
                −
              </button>
              <span className="text-lg font-bold min-w-[4.5rem] text-center">
                {formatQty(qty, product.unit)}
              </span>
              <button
                onClick={() => setQty((q) => clampQty(q + step, product.unit))}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 text-lg font-bold flex items-center justify-center active:scale-90 transition-transform"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* sticky CTA */}
        <div className="p-4 border-t border-gray-100 safe-bottom">
          <button
            onClick={handleAdd}
            className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <span>Savatchaga qo'shish</span>
            <span>—</span>
            <span>{formatPrice(product.newPrice * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
