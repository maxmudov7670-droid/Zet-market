import React, { useRef, useState } from "react";
import api from "../api.js";

const UNIT_OPTIONS = [
  { value: "dona", label: "dona (butun son)" },
  { value: "kg", label: "kg (kilogramm)" },
  { value: "litr", label: "litr" },
];

const EMPTY = {
  name: "",
  description: "",
  imageUrl: "",
  oldPrice: "",
  newPrice: "",
  unit: "dona",
  category: "Oziq-ovqat",
  isActive: true,
};

export default function ProductFormModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(() => (product ? { ...EMPTY, ...product } : EMPTY));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload", formData);
      update("imageUrl", res.data.url);
    } catch (err) {
      console.error("Rasm yuklashda xatolik:", err);
      alert(err?.response?.data?.error || "Rasmni yuklab bo'lmadi");
    } finally {
      setUploading(false);
      e.target.value = ""; // xohlasa yana o'sha faylni qayta tanlay olishi uchun
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.newPrice) {
      alert("Nomi va yangi narxi majburiy");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        oldPrice: form.oldPrice === "" ? null : Number(form.oldPrice),
        newPrice: Number(form.newPrice),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {product ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Nomi</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Ta'rifi (har bir tarkib qatordan)</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Rasm</label>
            <div className="mt-1 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🛒</span>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm font-semibold text-brand bg-brand-light px-3 py-2 rounded-xl disabled:opacity-60"
                >
                  {uploading
                    ? "Yuklanmoqda..."
                    : form.imageUrl
                    ? "Rasmni almashtirish"
                    : "Galereyadan tanlash"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Eski narxi</label>
              <input
                type="number"
                value={form.oldPrice ?? ""}
                onChange={(e) => update("oldPrice", e.target.value)}
                className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Yangi narxi *</label>
              <input
                type="number"
                value={form.newPrice}
                onChange={(e) => update("newPrice", e.target.value)}
                className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">O'lchov birligi</label>
            <select
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Narx shu birlik uchun ko'rsatiladi (masalan 1 kg yoki 1 dona narxi)
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Kategoriya</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Faol (mijozlarga ko'rinadi)</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </div>
  );
}
