import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import api, { getTelegramUser } from "../api.js";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../components/ProductCard.jsx";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PREPARING: "bg-blue-100 text-blue-700",
  DELIVERING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function Profile() {
  const navigate = useNavigate();
  const { setCartFromOrder } = useCart();
  const tgUser = getTelegramUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tgUser?.id) {
      setLoading(false);
      return;
    }
    api
      .get(`/orders/user/${tgUser.id}`)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Buyurtmalar tarixini yuklashda xatolik:", err))
      .finally(() => setLoading(false));
  }, [tgUser?.id]);

  function reorder(order) {
    setCartFromOrder(order.items);
    navigate("/cart");
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {[tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ") || "Mehmon"}
            </h1>
            {tgUser?.username && <p className="text-sm text-gray-400">@{tgUser.username}</p>}
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">📜 Mening buyurtmalarim</p>

        {loading ? (
          <p className="text-gray-400 text-sm text-center py-8">Yuklanmoqda...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Hali buyurtmalar yo'q</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    #{order.id} · {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.statusLabel}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  {order.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
                  <button
                    onClick={() => reorder(order)}
                    className="text-xs font-semibold text-brand bg-brand-light px-3 py-1.5 rounded-lg"
                  >
                    Yana shundan buyurtma qilish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
