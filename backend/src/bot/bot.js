const { Telegraf, Markup } = require("telegraf");
const prisma = require("../lib/prisma");
const { STATUS_MESSAGES_UZ, PAYMENT_METHOD_LABELS_UZ } = require("../lib/orderStatus");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  const miniAppUrl = process.env.MINIAPP_URL;
  const firstName = ctx.from?.first_name || "";

  ctx.reply(
    `Assalomu alaykum, ${firstName}! 🛒\n\nZet Marketga xush kelibsiz.\nKerakli mahsulotlarni buyurtma qilish uchun quyidagi tugmani bosing 👇`,
    Markup.inlineKeyboard([
      Markup.button.webApp("🛒 Buyurtma berish", miniAppUrl),
    ])
  );
});

bot.help((ctx) => {
  ctx.reply(
    "Buyurtma berish uchun /start buyrug'ini yuboring va ochilgan tugma orqali ilovani oching."
  );
});

// Kuryerlar/xodimlar guruhini sozlash uchun yordamchi buyruq: bot qo'shilgan
// guruhda shu buyruqni yuborsangiz, bot guruh ID'sini aytadi — shuni
// COURIER_CHAT_ID va/yoki STAFF_CHAT_ID muhit o'zgaruvchisiga yozasiz.
bot.command("groupid", (ctx) => {
  if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
    ctx.reply(`Ushbu guruh ID: \`${ctx.chat.id}\``, { parse_mode: "Markdown" });
  } else {
    ctx.reply("Bu buyruq faqat guruh chatida ishlaydi.");
  }
});

/**
 * Backend'dan buyurtma bazaga yozilgach (naqd) yoki to'lov tasdiqlangach
 * (Click/Payme) chaqiriladi — mijozga tasdiqlash xabarini yuboradi.
 */
async function notifyOrderConfirmed(telegramId, orderId) {
  try {
    await bot.telegram.sendMessage(
      telegramId,
      `✅ Buyurtmangiz muvaffaqiyatli qabul qilindi!\nBuyurtma raqami: #${orderId}\nTez orada yig'ib, yetkazishni boshlaymiz 🛒`
    );
  } catch (err) {
    console.error(`Foydalanuvchi ${telegramId}ga xabar yuborishda xatolik:`, err.message);
  }
}

/**
 * Admin panelda (yoki Telegram tugmalari orqali) buyurtma holati
 * o'zgarganda mijozga xabar yuboradi.
 */
async function notifyStatusChange(telegramId, orderId, status) {
  const buildMessage = STATUS_MESSAGES_UZ[status];
  if (!buildMessage) return; // PENDING kabi holatlar uchun alohida xabar yo'q
  try {
    await bot.telegram.sendMessage(telegramId, buildMessage(orderId));
  } catch (err) {
    console.error(`Foydalanuvchi ${telegramId}ga holat xabarini yuborishda xatolik:`, err.message);
  }
}

function buildMapsLink(location) {
  if (!location) return null;
  const match = location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (!match) return null;
  return `https://maps.google.com/?q=${match[1]},${match[2]}`;
}

function formatOrderForCourier(order) {
  const itemsText = order.items.map((i) => `• ${i.name} x${i.qty}`).join("\n");
  const customerName =
    [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || "Noma'lum";
  const mapsLink = buildMapsLink(order.location);

  return (
    `🛵 *Yangi yetkazib berish* — Buyurtma #${order.id}\n\n` +
    `👤 ${customerName}\n` +
    `📞 ${order.user.phone || "-"}\n` +
    `📍 ${mapsLink || order.location || "Manzil ko'rsatilmagan"}\n\n` +
    `${itemsText}\n\n` +
    `💰 Jami: ${new Intl.NumberFormat("uz-UZ").format(order.totalPrice)} so'm` +
    (order.note ? `\n📝 ${order.note}` : "")
  );
}

/**
 * Oshxona/xodimlar guruhi uchun yangi buyurtma matni — buyurtma tushgan
 * zahoti (naqd) yoki to'lov tasdiqlangach (Click/Payme) yuboriladi.
 */
function formatOrderForStaff(order) {
  const itemsText = order.items.map((i) => `• ${i.name} x${i.qty}`).join("\n");
  const customerName =
    [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || "Noma'lum";
  const paymentLabel = PAYMENT_METHOD_LABELS_UZ[order.paymentMethod] || order.paymentMethod;

  return (
    `🆕 *Yangi buyurtma* — #${order.id}\n\n` +
    `👤 ${customerName}\n` +
    `📞 ${order.user.phone || "-"}\n` +
    `📍 ${order.location || "Manzil ko'rsatilmagan"}\n\n` +
    `${itemsText}\n\n` +
    `💰 Jami: ${new Intl.NumberFormat("uz-UZ").format(order.totalPrice)} so'm\n` +
    `💳 To'lov: ${paymentLabel}` +
    (order.note ? `\n📝 ${order.note}` : "")
  );
}

// STAFF_CHAT_ID alohida sozlanmagan bo'lsa, kuryerlar guruhi bilan bir xil
// guruhdan foydalanadi — kichik biznes uchun bitta guruh yetarli bo'lishi mumkin.
function getStaffChatId() {
  return process.env.STAFF_CHAT_ID || process.env.COURIER_CHAT_ID;
}

/**
 * Yangi buyurtma tushgach (naqd — darhol, Click/Payme — to'lov
 * tasdiqlangach) xodimlar guruhiga yuboriladi. Guruhdagi xodim tugmalar
 * orqali buyurtmani hech qanday kompyuterga o'tirmasdan boshqaradi:
 * "Yig'ishni boshlash" → "Yetkazishga chiqarish" → (kuryer) "Yetkazildi".
 */
async function notifyStaffNewOrder(order) {
  const chatId = getStaffChatId();
  if (!chatId) return; // Xodimlar guruhi hali sozlanmagan — jim o'tkazib yuboramiz

  try {
    const message = await bot.telegram.sendMessage(chatId, formatOrderForStaff(order), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("📦 Yig'ishni boshlash", `preparing:${order.id}`)],
        [Markup.button.callback("❌ Bekor qilish", `cancel:${order.id}`)],
      ]),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { staffMessageId: message.message_id },
    });
  } catch (err) {
    console.error("Xodimlar guruhiga xabar yuborishda xatolik:", err.message);
  }
}

/**
 * Buyurtma "Yetkazilmoqda" holatiga o'tganda kuryerlar guruhiga yuboriladi.
 * Guruhda "🙋 Men yetkazaman" tugmasi chiqadi — BIRINCHI bosgan kuryer
 * buyurtmani o'ziga "band qilib" oladi, shundan keyingina uni "Yetkazib
 * berildi" deb yakunlay oladi. Bu bilan bir nechta kuryer bitta buyurtmaga
 * bir vaqtda aralashib, bir-birining ishini "o'g'irlab" qo'yishining oldi
 * olinadi — guruhdagi istalgan odam emas, faqat band qilgan kuryer
 * yakunlay oladi.
 */
async function notifyCourierGroup(order) {
  const chatId = process.env.COURIER_CHAT_ID;
  if (!chatId) return; // Kuryer guruhi hali sozlanmagan — jim o'tkazib yuboramiz

  try {
    const message = await bot.telegram.sendMessage(chatId, formatOrderForCourier(order), {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        Markup.button.callback("🙋 Men yetkazaman", `claim:${order.id}`),
      ]),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { courierMessageId: message.message_id },
    });
  } catch (err) {
    console.error("Kuryer guruhiga xabar yuborishda xatolik:", err.message);
  }
}

// Xodim "📦 Yig'ishni boshlash" tugmasini bosganda ishlaydi.
// Faqat hali "Kutilmoqda" holatidagi buyurtmalar uchun ishlaydi — shu bilan
// ikki kishi bir vaqtda tugma bossa yoki Admin Panel bilan to'qnashsa,
// noto'g'ri qayta ishlashning oldi olinadi.
bot.action(/^preparing:(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  try {
    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current) return ctx.answerCbQuery("Buyurtma topilmadi");
    if (current.status !== "PENDING") {
      return ctx.answerCbQuery("Bu buyurtma allaqachon ko'rib chiqilgan");
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PREPARING" },
      include: { user: true },
    });

    await notifyStatusChange(order.user.telegramId, order.id, "PREPARING");

    const staffName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ");
    await ctx.editMessageText(
      `${formatOrderForStaff(order)}\n\n📦 *Yig'ilmoqda* — ${staffName} boshladi`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("🛵 Yetkazishga chiqarish", `delivering:${order.id}`)],
          [Markup.button.callback("❌ Bekor qilish", `cancel:${order.id}`)],
        ]),
      }
    );
    await ctx.answerCbQuery("Buyurtma yig'ilmoqda deb belgilandi 📦");
  } catch (err) {
    console.error("Yig'ishni boshlashda xatolik:", err.message);
    await ctx.answerCbQuery("Xatolik yuz berdi, qayta urinib ko'ring");
  }
});

// Xodim "🛵 Yetkazishga chiqarish" tugmasini bosganda ishlaydi.
// Faqat "Yig'ilmoqda" holatidagi buyurtmalar uchun ishlaydi.
bot.action(/^delivering:(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  try {
    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current) return ctx.answerCbQuery("Buyurtma topilmadi");
    if (current.status !== "PREPARING") {
      return ctx.answerCbQuery("Bu buyurtma hali tayyorlanmoqda holatida emas");
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERING" },
      include: { user: true },
    });

    await notifyStatusChange(order.user.telegramId, order.id, "DELIVERING");
    await notifyCourierGroup(order);

    const staffName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ");
    await ctx.editMessageText(
      `${formatOrderForStaff(order)}\n\n🛵 *Yetkazishga chiqarildi* — ${staffName} tomonidan`,
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery("Buyurtma kuryerga uzatildi 🛵");
  } catch (err) {
    console.error("Yetkazishga chiqarishda xatolik:", err.message);
    await ctx.answerCbQuery("Xatolik yuz berdi, qayta urinib ko'ring");
  }
});

// Xodim "❌ Bekor qilish" tugmasini bosganda ishlaydi. Buyurtma allaqachon
// yetkazishga chiqarilgan yoki yakunlangan bo'lsa endi bekor qilib bo'lmaydi.
bot.action(/^cancel:(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  try {
    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current) return ctx.answerCbQuery("Buyurtma topilmadi");
    if (["DELIVERING", "DELIVERED", "CANCELLED"].includes(current.status)) {
      return ctx.answerCbQuery("Bu buyurtmani endi bekor qilib bo'lmaydi");
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
      include: { user: true },
    });

    await notifyStatusChange(order.user.telegramId, order.id, "CANCELLED");

    const staffName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ");
    await ctx.editMessageText(
      `${formatOrderForStaff(order)}\n\n❌ *Bekor qilindi* — ${staffName} tomonidan`,
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery("Buyurtma bekor qilindi ❌");
  } catch (err) {
    console.error("Bekor qilishda xatolik:", err.message);
    await ctx.answerCbQuery("Xatolik yuz berdi, qayta urinib ko'ring");
  }
});

// Kuryer "🙋 Men yetkazaman" tugmasini bosganda ishlaydi — buyurtmani
// o'ziga "band qiladi". Atomik yangilanadi (updateMany + count tekshiruvi)
// — shu bilan ikkita kuryer bir vaqtda bossa ham faqat BITTASI band qila
// oladi (poyga holatidan himoya).
bot.action(/^claim:(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  const courierName =
    [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ") || "Kuryer";
  try {
    const claim = await prisma.order.updateMany({
      where: { id: orderId, status: "DELIVERING", courierTelegramId: null },
      data: { courierTelegramId: String(ctx.from.id), courierName },
    });

    if (claim.count === 0) {
      return ctx.answerCbQuery("Bu buyurtma allaqachon band qilingan yoki holati o'zgargan");
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });

    await ctx.editMessageText(
      `${formatOrderForCourier(order)}\n\n🙋 *Band qilindi* — ${courierName}`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          Markup.button.callback("✅ Yetkazib berildi", `delivered:${order.id}`),
        ]),
      }
    );
    await ctx.answerCbQuery("Buyurtma sizga biriktirildi 🙋");
  } catch (err) {
    console.error("Buyurtmani band qilishda xatolik:", err.message);
    await ctx.answerCbQuery("Xatolik yuz berdi, qayta urinib ko'ring");
  }
});

// Kuryer "✅ Yetkazib berildi" tugmasini bosganda ishlaydi.
// Faqat "Yetkazilmoqda" holatidagi VA shu buyurtmani band qilgan kuryer
// uchun ishlaydi — guruhdagi boshqa odam bosolmaydi.
bot.action(/^delivered:(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  try {
    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current) return ctx.answerCbQuery("Buyurtma topilmadi");
    if (current.status !== "DELIVERING") {
      return ctx.answerCbQuery("Bu buyurtma hali yetkazishga chiqarilmagan");
    }
    if (current.courierTelegramId && current.courierTelegramId !== String(ctx.from.id)) {
      return ctx.answerCbQuery("Bu buyurtmani faqat uni band qilgan kuryer yakunlashi mumkin");
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" },
      include: { user: true },
    });

    await notifyStatusChange(order.user.telegramId, order.id, "DELIVERED");

    const courierName =
      order.courierName || [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ");
    await ctx.editMessageText(
      `${formatOrderForCourier(order)}\n\n✅ *Yetkazildi* — ${courierName} tomonidan tasdiqlandi`,
      { parse_mode: "Markdown" }
    );
    await ctx.answerCbQuery("Rahmat! Buyurtma yetkazilgan deb belgilandi ✅");
  } catch (err) {
    console.error("Kuryer tasdiqlashida xatolik:", err.message);
    await ctx.answerCbQuery("Xatolik yuz berdi, qayta urinib ko'ring");
  }
});

module.exports = {
  bot,
  notifyOrderConfirmed,
  notifyStatusChange,
  notifyStaffNewOrder,
  notifyCourierGroup,
};
