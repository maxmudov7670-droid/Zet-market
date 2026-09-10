import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ProductSheet from "../components/ProductSheet.jsx";
import api from "../api.js";

export default function Catalog() {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Bosh sahifadagi bezak (masalan "Aksiya") bosilib kelingan bo'lsa, o'sha
  // bezakka bog'langan kategoriya bilan ochiladi — aks holda "Barchasi".
  const [activeCategory, setActiveCategory] = useState(location.state?.category || "Barchasi");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Mahsulotlarni yuklashda xatolik:", err))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Barchasi", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === "Barchasi") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900">Katalog</h1>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-gray-400">Yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-gray-400">Mahsulot topilmadi</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 mt-1">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />
          ))}
        </div>
      )}

      <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <BottomNav />
    </div>
  );
}
