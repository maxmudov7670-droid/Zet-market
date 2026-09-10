import React, { useCallback, useEffect, useState } from "react";
import api from "../api.js";
import ProductFormModal from "../components/ProductFormModal.jsx";

function formatPrice(value) {
  return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
}

function unitLabel(unit) {
  if (unit === "kg") return "kg";
  if (unit === "litr") return "litr";
  return "dona";
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/products?all=true");
      setProducts(res.data);
    } catch (err) {
      console.error("Mahsulotlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function handleSave(data) {
    if (editingProduct) {
      await api.put(`/products/${editingProduct.id}`, data);
    } else {
      await api.post("/products", data);
    }
    setModalOpen(false);
    setEditingProduct(null);
    await load();
  }

  async function handleDelete(product) {
    if (!confirm(`"${product.name}" mahsulotini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      await load();
    } catch (err) {
      console.error("O'chirishda xatolik:", err);
      alert("Mahsulotni o'chirib bo'lmadi");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mahsulotlar</h1>
          <p className="text-sm text-gray-400 mt-1">Jami {products.length} ta mahsulot</p>
        </div>
        <button
          onClick={openCreate}
          className="text-sm font-semibold text-white bg-brand px-4 py-2 rounded-xl"
        >
          + Yangi mahsulot
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Rasm</th>
                <th className="px-5 py-3 font-medium">Nomi</th>
                <th className="px-5 py-3 font-medium">Kategoriya</th>
                <th className="px-5 py-3 font-medium">Narxi</th>
                <th className="px-5 py-3 font-medium">Holati</th>
                <th className="px-5 py-3 font-medium text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Mahsulotlar yo'q
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-5 py-3 text-gray-600">{product.category}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {product.oldPrice && (
                        <span className="text-gray-400 line-through text-xs mr-1">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                      <span className="font-semibold text-gray-900">{formatPrice(product.newPrice)}</span>
                      <span className="text-gray-400 text-xs"> / {unitLabel(product.unit)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.isActive ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-xs font-semibold text-brand bg-brand-light px-3 py-1.5 rounded-lg"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        O'chirish
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
