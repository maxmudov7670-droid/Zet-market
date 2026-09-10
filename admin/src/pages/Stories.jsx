import React, { useCallback, useEffect, useState } from "react";
import api from "../api.js";
import StoryFormModal from "../components/StoryFormModal.jsx";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/stories?all=true");
      setStories(res.data);
    } catch (err) {
      console.error("Bezaklarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingStory(null);
    setModalOpen(true);
  }

  function openEdit(story) {
    setEditingStory(story);
    setModalOpen(true);
  }

  async function handleSave(data) {
    if (editingStory) {
      await api.put(`/stories/${editingStory.id}`, data);
    } else {
      await api.post("/stories", data);
    }
    setModalOpen(false);
    setEditingStory(null);
    await load();
  }

  async function handleDelete(story) {
    if (!confirm(`"${story.label}" bezagini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await api.delete(`/stories/${story.id}`);
      await load();
    } catch (err) {
      console.error("O'chirishda xatolik:", err);
      alert("Bezakni o'chirib bo'lmadi");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bosh sahifa bezaklari</h1>
          <p className="text-sm text-gray-400 mt-1">
            Mini App'ning bosh sahifasidagi "Yangi", "Aksiya" kabi doiralar
          </p>
        </div>
        <button
          onClick={openCreate}
          className="text-sm font-semibold text-white bg-brand px-4 py-2 rounded-xl"
        >
          + Yangi bezak
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Emoji</th>
                <th className="px-5 py-3 font-medium">Nomi</th>
                <th className="px-5 py-3 font-medium">Kategoriya</th>
                <th className="px-5 py-3 font-medium">Tartib</th>
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
              ) : stories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    Hozircha bezaklar yo'q
                  </td>
                </tr>
              ) : (
                stories.map((story) => (
                  <tr key={story.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-2xl">{story.emoji}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{story.label}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {story.category || <span className="text-gray-300">Barchasi</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{story.sortOrder}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          story.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {story.isActive ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(story)}
                        className="text-xs font-semibold text-brand bg-brand-light px-3 py-1.5 rounded-lg"
                      >
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => handleDelete(story)}
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
        <StoryFormModal
          story={editingStory}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
