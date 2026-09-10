import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const LINKS = [
  { to: "/orders", icon: "🧾", label: "Buyurtmalar" },
  { to: "/products", icon: "🛒", label: "Mahsulotlar" },
  { to: "/stories", icon: "✨", label: "Bosh sahifa" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("admin_password");
    navigate("/login", { replace: true });
  }

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen px-4 py-6 flex flex-col">
      <div className="flex items-center gap-2 px-2 mb-8">
        <span className="text-2xl">🛒</span>
        <div>
          <p className="font-bold text-gray-900 leading-tight">Zet Market</p>
          <p className="text-xs text-gray-400 leading-tight">Admin Panel</p>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-brand-light text-brand" : "text-gray-500 hover:bg-gray-50"
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      >
        <span>🚪</span>
        Chiqish
      </button>
    </aside>
  );
}
