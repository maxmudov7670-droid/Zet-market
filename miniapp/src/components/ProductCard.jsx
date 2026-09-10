import React from "react";
import { useCart } from "../context/CartContext.jsx";
import { unitLabel } from "../lib/units.js";

function formatPrice(value) {
  return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
}

export default function ProductCard({ product, onOpen }) {
  const { addItem } = useCart();

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => onOpen(product)}
    >
      <div className="relative aspect-square bg-gray-50">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem(product);
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-brand text-white text-lg font-bold flex items-center justify-center shadow-md active:scale-90 transition-transform"
          aria-label="Tezkor qo'shish"
        >
          +
        </button>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{product.name}</p>
        <div className="flex items-baseline gap-2 mt-1">
          {product.oldPrice && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
          )}
          <span className="text-sm font-bold text-brand">
            {formatPrice(product.newPrice)}
            <span className="text-gray-400 font-normal"> / {unitLabel(product.unit)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export { formatPrice };
