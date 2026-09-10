import React, { useEffect, useState } from "react";
import api from "../api.js";

const EMPTY = {
  emoji: "🔥",
  label: "",
  category: "",
  sortOrder: 0,
  isActive: true,
};

export default function StoryFormModal({ story, onClose, onSave }) {
  const [form, setForm] = useState(() => (story ? { ...EMPTY, ...story, category: story.category || "" } : EMPTY));
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api
      .get("/products?all=true")
      .then((res) => {
        const set = new Set(res.data.map((p) => p.category).filter(Boolean));
        setCategories(Array.from(set));
      })
      .catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.emoji.trim() || !form.label.trim()) {
      alert("Emoji va nomi majburiy");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
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
        className="relative bg-white rounded-2xl w-full max-w-sm p-6"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {story ? "Bezakni tahrirlash" : "Yangi bezak qo'shish"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Emoji</label>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => update("emoji", e.target.value)}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-2xl text-center outline-none focus:ring-2 focus:ring-brand/40"
              maxLength={4}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Nomi</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => update("label", e.target.value)}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Masalan: Yangi"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Bosilganda ochiladigan kategoriya</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="">Barchasi (filtrsiz)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Tanlansa, bu bezak bosilganda Katalog sahifasida faqat shu kategoriyadagi mahsulotlar ko'rsatiladi.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Tartib raqami</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => update("sortOrder", e.target.value)}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Kichik raqam chapdan ko'rinadi (0, 1, 2 ...)
            </p>
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700">Faol (Mini App'da ko'rinadi)</span>
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
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </div>
  );
}
