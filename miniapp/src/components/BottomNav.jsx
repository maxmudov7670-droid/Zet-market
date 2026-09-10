import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const TABS = [
  { path: "/home", icon: "🏠", label: "Bosh sahifa" },
  { path: "/catalog", icon: "🔍", label: "Katalog" },
  { path: "/cart", icon: "🛒", label: "Savatcha" },
  { path: "/profile", icon: "👤", label: "Profil" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40">
      <div className="flex items-stretch justify-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1"
            >
              <span className={`text-xl ${active ? "" : "opacity-50"}`}>{tab.icon}</span>
              <span
                className={`text-[11px] ${
                  active ? "text-brand font-semibold" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
              {tab.path === "/cart" && totalCount > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-3 bg-brand text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
