import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import api, { getTelegramUser } from "../api.js";

// Tarmoq yuklanmagan holatda ham bosh sahifa bo'sh ko'rinmasligi uchun
// standart bezaklar — Admin Panelda saqlangan ro'yxat kelgach almashtiriladi.
const DEFAULT_STORIES = [
  { emoji: "🔥", label: "Yangi" },
  { emoji: "🎉", label: "Aksiya" },
  { emoji: "⭐️", label: "TOP" },
  { emoji: "🛒", label: "Katalog" },
  { emoji: "🎁", label: "Sovg'a" },
];

export default function Home() {
  const navigate = useNavigate();
  const user = getTelegramUser();
  const firstName = user?.first_name || "Mehmon";
  const [stories, setStories] = useState(DEFAULT_STORIES);

  useEffect(() => {
    api
      .get("/stories")
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setStories(res.data);
        }
      })
      .catch(() => {}); // yuklanmasa ham standart bezaklar ko'rsatilaveradi
  }, []);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-sm text-gray-400">Xush kelibsiz 👋</p>
        <h1 className="text-2xl font-bold text-gray-900">{firstName}</h1>
      </div>

      {/* Stories */}
      <div className="flex gap-4 px-5 py-4 overflow-x-auto no-scrollbar">
        {stories.map((story, idx) => (
          <button
            key={story.id ?? idx}
            onClick={() => navigate("/catalog", { state: { category: story.category || "Barchasi" } })}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand to-emerald-400 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl">
                {story.emoji}
              </div>
            </div>
            <span className="text-[11px] text-gray-500">{story.label}</span>
          </button>
        ))}
      </div>

      {/* Hero */}
      <div className="px-5 mt-4">
        <div
          className="relative rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate("/catalog")}
        >
          <div className="absolute -right-6 -bottom-6 text-[120px] opacity-20 select-none">🛒</div>
          <p className="text-white/80 text-sm mb-1">Bugun nima kerak?</p>
          <h2 className="text-white text-xl font-bold mb-4 max-w-[70%]">
            Kerakli mahsulotlarni buyurtma qiling
          </h2>
          <div className="inline-flex items-center gap-2 bg-white text-brand font-bold text-sm px-4 py-2.5 rounded-xl">
            Yangi buyurtma berish
            <span>→</span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <p className="text-sm text-gray-400">
          Katalogdan kerakli mahsulotlaringizni tanlang va bir necha daqiqada eshigingizga yetkazamiz.
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
