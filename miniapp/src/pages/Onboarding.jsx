import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SLIDES = [
  {
    emoji: "🛒",
    title: "Do'konga borishga vaqt yo'qmi?",
    text: "Zet Market kerakli mahsulotlarni tezkor yetkazib beradi.",
  },
  {
    emoji: "📱",
    title: "Bu qanday ishlaydi?",
    text: "Tanlang, buyurtma bering va uyingizda kuting.",
  },
  {
    emoji: "❤️",
    title: "10,000+ odam",
    text: "Allaqachon biz bilan buyurtma qilmoqda.",
  },
];

export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const isLast = index === SLIDES.length - 1;

  function handleNext() {
    if (isLast) {
      onFinish();
      navigate("/home", { replace: true });
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white px-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-7xl mb-8">{SLIDES[index].emoji}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{SLIDES[index].title}</h1>
        <p className="text-gray-500 text-base max-w-xs">{SLIDES[index].text}</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-brand" : "w-1.5 bg-gray-200"
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-brand text-white font-bold py-4 rounded-2xl mb-10 active:scale-[0.98] transition-transform"
      >
        {isLast ? "Boshla" : "Keyingisi"}
      </button>
    </div>
  );
}
