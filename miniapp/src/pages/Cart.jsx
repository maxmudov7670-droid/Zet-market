import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../components/ProductCard.jsx";
import { formatQty } from "../lib/units.js";
import api, { getTelegramUser } from "../api.js";

const PAYMENT_METHODS = [
  { key: "cash", label: "Naqd", hint: "Yetkazib berishda", emoji: "💵" },
  { key: "click", label: "Click", hint: "Onlayn to'lov", emoji: "🔵" },
  { key: "payme", label: "Payme", hint: "Onlayn to'lov", emoji: "🟢" },
];

export default function Cart() {
  const navigate = useNavigate();
  const { items, increment, decrement, total, clearCart } = useCart();
  const tgUser = getTelegramUser();

  const [name, setName] = useState(
    () => [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ") || ""
  );
  const [phone, setPhone] = useState(() => localStorage.getItem("zetmarket_last_phone") || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentConfig, setPaymentConfig] = useState({ cash: true, click: false, payme: false });

  useEffect(() => {
    api
      .get("/config")
      .then((res) => setPaymentConfig(res.data))
      .catch(() => {}); // ochilmasa ham naqd to'lov har doim ishlayveradi
  }, []);

  function detectLocation() {
    if (!navigator.geolocation) {
      setError("Bu qurilmada avtomatik joylashuv aniqlash mavjud emas, manzilni qo'lda kiriting.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddress(`📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setLocating(false);
      },
      () => {
        setError("Joylashuvni aniqlab bo'lmadi, iltimos manzilni qo'lda kiriting.");
        setLocating(false);
      }
    );
  }

  async function handleConfirm() {
    setError("");
    if (items.length === 0) {
      setError("Savatchangiz bo'sh");
      return;
    }
    if (!phone.trim()) {
      setError("Telefon raqamingizni kiriting");
      return;
    }
    if (!address.trim()) {
      setError("Yetkazib berish manzilini kiriting");
      return;
    }

    setSubmitting(true);
    try {
      localStorage.setItem("zetmarket_last_phone", phone.trim());

      const res = await api.post("/orders", {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        location: address.trim(),
        note: note.trim(),
        phone: phone.trim(),
        paymentMethod,
      });

      clearCart();

      // Click/Payme tanlangan bo'lsa — mijozni to'lov sahifasiga yo'naltiramiz
      if (res.data.paymentUrl) {
        if (window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(res.data.paymentUrl);
        } else {
          window.open(res.data.paymentUrl, "_blank");
        }
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert
            ? window.Telegram.WebApp.showAlert(
                "Buyurtmangiz qabul qilindi! To'lovni yakunlash uchun ochilgan sahifadan foydalaning.",
                () => window.Telegram.WebApp.close()
              )
            : window.Telegram.WebApp.close();
        } else {
          navigate("/home");
        }
        return;
      }

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback?.notificationOccurred("success");
        window.Telegram.WebApp.showAlert
          ? window.Telegram.WebApp.showAlert("Buyurtmangiz qabul qilindi! 🛒", () =>
              window.Telegram.WebApp.close()
            )
          : window.Telegram.WebApp.close();
      } else {
        alert("Buyurtmangiz qabul qilindi! 🛒");
        navigate("/home");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Buyurtma yuborishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white pb-24 flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-gray-500 text-center mb-6">Savatchangiz hozircha bo'sh</p>
        <button
          onClick={() => navigate("/catalog")}
          className="bg-brand text-white font-bold px-6 py-3 rounded-2xl"
        >
          Katalogga o'tish
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-xl font-bold text-gray-900">Savatcha</h1>
      </div>

      <div className="px-5 space-y-3 mt-2">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
            <div className="w-16 h-16 rounded-xl bg-white overflow-hidden shrink-0">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
              <p className="text-brand font-bold text-sm">{formatPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => decrement(item.productId)}
                className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold"
              >
                −
              </button>
              <span className="min-w-[3.5rem] text-center text-sm font-bold">
                {formatQty(item.qty, item.unit)}
              </span>
              <button
                onClick={() => increment(item.productId)}
                className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout form */}
      <div className="px-5 mt-6 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Yetkazib berish ma'lumotlari</p>

        <input
          type="text"
          placeholder="Ismingiz"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
        <input
          type="tel"
          placeholder="Telefon raqamingiz (+998 ...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/40"
        />
        <div className="space-y-2">
          <textarea
            placeholder="Yetkazib berish manzili"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/40 resize-none"
          />
          <button
            onClick={detectLocation}
            disabled={locating}
            className="text-xs font-semibold text-brand flex items-center gap-1"
          >
            {locating ? "Aniqlanmoqda..." : "📍 Joylashuvni avtomatik aniqlash"}
          </button>
        </div>
        <textarea
          placeholder="Izoh (ixtiyoriy)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand/40 resize-none"
        />

        <p className="text-sm font-semibold text-gray-700 pt-2">To'lov usuli</p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((pm) => {
            const enabled = paymentConfig[pm.key];
            const active = paymentMethod === pm.key;
            return (
              <button
                key={pm.key}
                type="button"
                disabled={!enabled}
                onClick={() => setPaymentMethod(pm.key)}
                className={`rounded-xl px-2 py-3 text-center border transition-colors ${
                  active
                    ? "border-brand bg-brand-light"
                    : "border-gray-100 bg-gray-50"
                } ${!enabled ? "opacity-40" : ""}`}
              >
                <div className="text-xl">{pm.emoji}</div>
                <p className="text-xs font-semibold text-gray-900 mt-1">{pm.label}</p>
                <p className="text-[10px] text-gray-400">{enabled ? pm.hint : "Tez orada"}</p>
              </button>
            );
          })}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-[64px] left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 safe-bottom">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Jami</span>
            <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {submitting ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
