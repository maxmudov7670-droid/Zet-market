import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

export default function Login() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/admin/login", { password });
      localStorage.setItem("admin_password", password);
      navigate("/orders", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm shadow-sm"
      >
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🛒</span>
          <div>
            <p className="font-bold text-gray-900 leading-tight">Zet Market</p>
            <p className="text-xs text-gray-400 leading-tight">Admin Panel</p>
          </div>
        </div>

        <label className="text-sm font-medium text-gray-700">Parol</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full bg-gray-50 rounded-xl px-4 py-3 mt-1.5 mb-4 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-brand text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "Tekshirilmoqda..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
