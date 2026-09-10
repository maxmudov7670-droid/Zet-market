import React, { useCallback, useEffect, useState } from "react";
import api from "../api.js";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Kutilmoqda", color: "bg-yellow-100 text-yellow-700" },
  { value: "PREPARING", label: "Yig'ilmoqda", color: "bg-blue-100 text-blue-700" },
  { value: "DELIVERING", label: "Yetkazilmoqda", color: "bg-purple-100 text-purple-700" },
  { value: "DELIVERED", label: "Yetkazildi", color: "bg-green-100 text-green-700" },
  { value: "CANCELLED", label: "Bekor qilindi", color: "bg-red-100 text-red-700" },
];

function formatPrice(value) {
  return new Intl.NumberFormat("uz-UZ").format(value) + " so'm";
}

function statusMeta(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

const PAYMENT_STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Buyurtmalarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // har 15 sekundda yangilanadi
    return () => clearInterval(interval);
  }, [load]);

  async function changeStatus(orderId, status) {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await load();
    } catch (err) {
      console.error("Holatni yangilashda xatolik:", err);
      alert("Holatni yangilab bo'lmadi");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
          <p className="text-sm text-gray-400 mt-1">Jami {orders.length} ta buyurtma</p>
        </div>
        <button
          onClick={load}
          className="text-sm font-semibold text-brand bg-brand-light px-4 py-2 rounded-xl"
        >
          🔄 Yangilash
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Mijoz</th>
                <th className="px-5 py-3 font-medium">Telefon</th>
                <th className="px-5 py-3 font-medium">Mahsulotlar</th>
                <th className="px-5 py-3 font-medium">Jami</th>
                <th className="px-5 py-3 font-medium">To'lov</th>
                <th className="px-5 py-3 font-medium">Sana</th>
                <th className="px-5 py-3 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    Hozircha buyurtmalar yo'q
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 align-top">
                    <td className="px-5 py-4 text-gray-400">#{order.id}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">{order.customerName}</td>
                    <td className="px-5 py-4 text-gray-600">{order.customerPhone}</td>
                    <td className="px-5 py-4 text-gray-600 max-w-xs">
                      {order.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-gray-700 text-xs font-medium">{order.paymentMethodLabel}</p>
                      <span
                        className={`inline-block mt-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                          PAYMENT_STATUS_COLOR[order.paymentStatus] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.paymentStatusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleString("uz-UZ")}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => changeStatus(order.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 outline-none cursor-pointer ${
                          statusMeta(order.status).color
                        }`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
