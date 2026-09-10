const express = require("express");
const prisma = require("../lib/prisma");
const { requireTelegramAuth } = require("../middleware/telegramAuth");
const { requireAdminAuth } = require("../middleware/adminAuth");
const {
  notifyOrderConfirmed,
  notifyStatusChange,
  notifyStaffNewOrder,
  notifyCourierGroup,
} = require("../bot/bot");
const {
  STATUS_LABELS_UZ,
  PAYMENT_METHOD_LABELS_UZ,
  PAYMENT_STATUS_LABELS_UZ,
} = require("../lib/orderStatus");
const { buildPaymentUrl, isClickConfigured, isPaymeConfigured } = require("../lib/paymentLinks");
const { clampQty } = require("../lib/units");

const router = express.Router();

const VALID_PAYMENT_METHODS = ["cash", "click", "payme"];

function serializeOrder(order) {
  return {
    id: order.id,
    status: order.status,
    statusLabel: STATUS_LABELS_UZ[order.status] || order.status,
    items: order.items,
    totalPrice: order.totalPrice,
    location: order.location,
    note: order.note,
    createdAt: order.createdAt,
    customerName: [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || "Noma'lum",
    customerPhone: order.user.phone || "-",
    customerUsername: order.user.username,
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: PAYMENT_METHOD_LABELS_UZ[order.paymentMethod] || order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentStatusLabel: PAYMENT_STATUS_LABELS_UZ[order.paymentStatus] || order.paymentStatus,
  };
}

// GET /api/orders  (Admin Panel: barcha buyurtmalar ro'yxati)
router.get("/", requireAdminAuth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(serializeOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Buyurtmalarni olishda xatolik" });
  }
});

// PATCH /api/orders/:id/status  (Admin Panel: holatni o'zgartirish)
router.patch("/:id/status", requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUS_LABELS_UZ[status]) {
      return res.status(400).json({ error: "Noto'g'ri holat qiymati" });
    }
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { user: true },
    });
    res.json(serializeOrder(order));

    // Mijozga xabar (fon rejimida — javobni kutdirmaymiz)
    notifyStatusChange(order.user.telegramId, order.id, status);

    // Buyurtma yetkazib berishga chiqqanda kuryerlar guruhiga yuboriladi
    if (status === "DELIVERING") {
      notifyCourierGroup(order);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Holatni yangilashda xatolik" });
  }
});

// GET /api/orders/user/:telegramId  (Mini App: "Mening buyurtmalarim")
router.get("/user/:telegramId", requireTelegramAuth, async (req, res) => {
  try {
    // Xavfsizlik: faqat autentifikatsiyadan o'tgan foydalanuvchi o'zining
    // buyurtmalarini so'rashi mumkin — boshqa telegramId bo'yicha so'ralsa rad etiladi.
    if (String(req.telegramUser.id) !== String(req.params.telegramId)) {
      return res.status(403).json({ error: "Ruxsat berilmagan" });
    }

    const user = await prisma.user.findUnique({ where: { telegramId: String(req.params.telegramId) } });
    if (!user) return res.json([]);

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders.map(serializeOrder));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Buyurtmalar tarixini olishda xatolik" });
  }
});

// POST /api/orders  (Mini App: yangi buyurtma yaratish)
router.post("/", requireTelegramAuth, async (req, res) => {
  try {
    const { items, location, note, phone, paymentMethod } = req.body;
    const tgUser = req.telegramUser;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Savatcha bo'sh" });
    }

    const method = VALID_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : "cash";

    // Click/Payme hali sozlanmagan bo'lsa, shu usulda buyurtma qilishga yo'l qo'ymaymiz
    if (method === "click" && !isClickConfigured()) {
      return res.status(400).json({ error: "Click orqali to'lov hali faollashtirilmagan" });
    }
    if (method === "payme" && !isPaymeConfigured()) {
      return res.status(400).json({ error: "Payme orqali to'lov hali faollashtirilmagan" });
    }

    // Foydalanuvchini topamiz/yaratamiz
    const user = await prisma.user.upsert({
      where: { telegramId: String(tgUser.id) },
      update: {
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        username: tgUser.username || null,
        ...(phone && { phone }),
      },
      create: {
        telegramId: String(tgUser.id),
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        username: tgUser.username || null,
        phone: phone || null,
      },
    });

    // XAVFSIZLIK: narxlarni mijozdan emas, bazadan o'zimiz hisoblaymiz —
    // aks holda mijoz frontenddan narxni o'zgartirib yuborishi mumkin edi.
    const productIds = items.map((i) => Number(i.productId));
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalPrice = 0;
    const orderItems = [];
    for (const item of items) {
      const product = productMap.get(Number(item.productId));
      if (!product || !product.isActive) continue;
      // Miqdorni HAR DOIM serverda o'zimiz "tozalaymiz" (mijozga ishonmaymiz):
      // dona uchun butun son, kg/litr uchun 0.5 qadamli kasr son.
      const qty = clampQty(item.qty, product.unit);
      totalPrice += Math.round(product.newPrice * qty);
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.newPrice,
        unit: product.unit,
        imageUrl: product.imageUrl,
        qty,
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ error: "Buyurtma uchun yaroqli mahsulot topilmadi" });
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        items: orderItems,
        totalPrice,
        location: location || null,
        note: note || null,
        status: "PENDING",
        paymentMethod: method,
        paymentStatus: "pending",
      },
      include: { user: true },
    });

    if (method === "cash") {
      // Naqd to'lovda buyurtma darhol tasdiqlangan hisoblanadi va
      // xodimlar guruhiga ham darhol yuboriladi
      notifyOrderConfirmed(tgUser.id, order.id);
      notifyStaffNewOrder(order);
      return res.status(201).json(serializeOrder(order));
    }

    // Click/Payme: mijoz to'lov sahifasiga yo'naltiriladi, tasdiqlash xabari
    // to'lov tizimidan tasdiq kelgach (webhook orqali) yuboriladi.
    const paymentUrl = buildPaymentUrl(method, order);
    res.status(201).json({ ...serializeOrder(order), paymentUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Buyurtma yaratishda xatolik" });
  }
});

module.exports = router;
