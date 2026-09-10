import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Cart from "./pages/Cart.jsx";
import Profile from "./pages/Profile.jsx";
import api from "./api.js";

const ONBOARDING_KEY = "zetmarket_onboarding_seen";

export default function App() {
  const [seenOnboarding, setSeenOnboarding] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === "true"
  );

  // Ilova ochilganda foydalanuvchini backend bilan sinxronlaymiz
  useEffect(() => {
    api.post("/users/sync").catch((err) => {
      console.warn("Foydalanuvchini sinxronlashda xatolik:", err?.message);
    });
  }, []);

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setSeenOnboarding(true);
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={<Onboarding onFinish={completeOnboarding} />}
      />
      <Route
        path="/"
        element={
          seenOnboarding ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />
        }
      />
      <Route path="/home" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
