const express = require("express");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { notifyOrderConfirmed, notifyStaffNewOrder } = require("../bot/bot");

const router = express.Router();

/* ========================================================================
 * CLICK — Merchant API (v2)
 * Hujjat: https://docs.click.uz
 * Click bitta endpointga POST yuboradi, action=0 (Prepare) va action=1
 * (Complete) bosqichlarini shu yerda ajratamiz.
 * ====================================================================== */

const CLICK_ERROR = {
  SIGN_FAILED: -1,
  WRONG_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  ORDER_CANCELLED: -7,
};

function clickSign({ click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time }) {
  const secret = process.env.CLICK_SECRET_KEY;
  const parts =
    action === "1" || action === 1
      ? [click_trans_id, service_id, secret, merchant_trans_id, merchant_prepare_id, amount, action, sign_time]
      : [click_trans_id, service_id, secret, merchant_trans_id, amount, action, sign_time];
  return crypto.createHash("md5").update(parts.join("")).digest("hex");
}

router.post("/click", express.urlencoded({ extended: true }), async (req, res) => {
  const body = req.body;
  const {
    click_trans_id,
    service_id,
    click_paydoc_id,
    merchant_trans_id,
    amount,
    action,
    sign_time,
    sign_string,
    error: clickError,
  } = body;

  const base = {
    click_trans_id,
    merchant_trans_id,
  };

  try {
    const expectedSign = clickSign(body);
    if (expectedSign !== sign_string) {
      return res.json({ ...base, error: CLICK_ERROR.SIGN_FAILED, error_note: "SIGN CHECK FAILED" });
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(merchant_trans_id) },
      include: { user: true },
    });
    if (!order) {
      return res.json({ ...base, error: CLICK_ERROR.ORDER_NOT_FOUND, error_note: "Order not found" });
    }

    // So'mda taqqoslaymiz — Click amount'ni "49000.00" ko'rinishida yuboradi
    if (Math.round(Number(amount)) !== order.totalPrice) {
      return res.json({ ...base, error: CLICK_ERROR.WRONG_AMOUNT, error_note: "Incorrect amount" });
    }

    if (String(action) === "0") {
      // --- PREPARE ---
      if (order.paymentStatus === "paid") {
        return res.json({ ...base, error: CLICK_ERROR.ALREADY_PAID, error_note: "Already paid" });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentProviderData: { click_trans_id, click_paydoc_id } },
      });

      return res.json({
        ...base,
        merchant_prepare_id: order.id,
        error: 0,
        error_note: "Success",
      });
    }

    if (String(action) === "1") {
      // --- COMPLETE ---
      const providerData = order.paymentProviderData || {};
      if (String(providerData.click_trans_id) !== String(click_trans_id)) {
        return res.json({ ...base, error: CLICK_ERROR.TRANSACTION_NOT_FOUND, error_note: "Transaction not found" });
      }

      if (Number(clickError) < 0) {
        // Click o'z tomonida to'lovni bekor qilgan/muvaffaqiyatsiz deb topgan
        await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "failed" } });
        return res.json({ ...base, merchant_confirm_id: order.id, error: 0, error_note: "Success" });
      }

      if (order.paymentStatus !== "paid") {
        await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "paid" } });
        notifyOrderConfirmed(order.user.telegramId, order.id);
        notifyStaffNewOrder(order);
      }

      return res.json({ ...base, merchant_confirm_id: order.id, error: 0, error_note: "Success" });
    }

    return res.json({ ...base, error: CLICK_ERROR.ACTION_NOT_FOUND, error_note: "Action not found" });
  } catch (err) {
    console.error("Click webhook xatosi:", err);
    return res.json({ ...base, error: CLICK_ERROR.ORDER_NOT_FOUND, error_note: "Internal error" });
  }
});

/* ========================================================================
 * PAYME — Merchant API (JSON-RPC 2.0)
 * Hujjat: https://developer.help.paycom.uz
 * Bitta endpoint, "method" maydoniga qarab tarmoqlanadi.
 * MUHIM: haqiqiy merchant kalitlari olingach, Payme sandbox test to'plami
 * bilan albatta birga sinab ko'rish tavsiya etiladi — ba'zi xato kodlari
 * ularning eng so'nggi hujjatiga qarab moslashtirilishi kerak bo'lishi mumkin.
 * ====================================================================== */

const PAYME_ERROR = {
  INVALID_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  CANNOT_CANCEL: -31007,
  CANNOT_PERFORM: -31008,
  ACCOUNT_NOT_FOUND: -31050,
  METHOD_NOT_FOUND: -32601,
};

const PAYME_EXPIRE_MS = 12 * 60 * 60 * 1000; // 12 soat

function requirePaymeAuth(req, res, next) {
  const auth = req.header("authorization") || "";
  const expected = "Basic " + Buffer.from(`Paycom:${process.env.PAYME_KEY}`).toString("base64");
  if (auth !== expected) {
    return res.json({
      error: { code: -32504, message: "Insufficient privilege to perform this method." },
      id: req.body?.id ?? null,
    });
  }
  next();
}

async function findOrderForPayme(orderId, amountTiyin) {
  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) {
    const e = new Error("not found");
    e.code = PAYME_ERROR.ACCOUNT_NOT_FOUND;
    throw e;
  }
  if (order.totalPrice * 100 !== Number(amountTiyin)) {
    const e = new Error("wrong amount");
    e.code = PAYME_ERROR.INVALID_AMOUNT;
    throw e;
  }
  return order;
}

router.post("/payme", requirePaymeAuth, async (req, res) => {
  const { method, params, id } = req.body;

  function ok(result) {
    res.json({ result, id });
  }
  function fail(code, message) {
    res.json({ error: { code, message }, id });
  }

  try {
    if (method === "CheckPerformTransaction") {
      await findOrderForPayme(params.account.order_id, params.amount);
      return ok({ allow: true });
    }

    if (method === "CreateTransaction") {
      const order = await findOrderForPayme(params.account.order_id, params.amount);

      const existing = await prisma.paymeTransaction.findUnique({ where: { id: params.id } });
      if (existing) {
        if (existing.state !== 1) {
          return fail(PAYME_ERROR.CANNOT_PERFORM, "Transaction state is invalid");
        }
        return ok({ create_time: Number(existing.createTime), transaction: existing.id, state: existing.state });
      }

      // Shu buyurtma uchun boshqa faol (holati=1 yoki 2) tranzaksiya bo'lmasligi kerak
      const activeForOrder = await prisma.paymeTransaction.findFirst({
        where: { orderId: order.id, state: { in: [1, 2] } },
      });
      if (activeForOrder) {
        return fail(PAYME_ERROR.ACCOUNT_NOT_FOUND, "Order already has an active transaction");
      }

      const tx = await prisma.paymeTransaction.create({
        data: {
          id: params.id,
          orderId: order.id,
          amount: params.amount,
          state: 1,
          createTime: BigInt(params.time),
        },
      });

      return ok({ create_time: Number(tx.createTime), transaction: tx.id, state: tx.state });
    }

    if (method === "PerformTransaction") {
      const tx = await prisma.paymeTransaction.findUnique({ where: { id: params.id } });
      if (!tx) return fail(PAYME_ERROR.TRANSACTION_NOT_FOUND, "Transaction not found");

      if (tx.state === 2) {
        return ok({ perform_time: Number(tx.performTime), transaction: tx.id, state: tx.state });
      }
      if (tx.state !== 1) {
        return fail(PAYME_ERROR.CANNOT_PERFORM, "Transaction state is invalid");
      }
      if (Date.now() - Number(tx.createTime) > PAYME_EXPIRE_MS) {
        await prisma.paymeTransaction.update({
          where: { id: tx.id },
          data: { state: -1, cancelTime: BigInt(Date.now()), reason: 4 },
        });
        return fail(PAYME_ERROR.CANNOT_PERFORM, "Transaction expired");
      }

      const performTime = Date.now();
      const updated = await prisma.paymeTransaction.update({
        where: { id: tx.id },
        data: { state: 2, performTime: BigInt(performTime) },
      });

      const order = await prisma.order.update({
        where: { id: tx.orderId },
        data: { paymentStatus: "paid" },
        include: { user: true },
      });
      notifyOrderConfirmed(order.user.telegramId, order.id);
      notifyStaffNewOrder(order);

      return ok({ perform_time: performTime, transaction: updated.id, state: updated.state });
    }

    if (method === "CancelTransaction") {
      const tx = await prisma.paymeTransaction.findUnique({ where: { id: params.id } });
      if (!tx) return fail(PAYME_ERROR.TRANSACTION_NOT_FOUND, "Transaction not found");

      if (tx.state === -1 || tx.state === -2) {
        return ok({ cancel_time: Number(tx.cancelTime), transaction: tx.id, state: tx.state });
      }

      const newState = tx.state === 2 ? -2 : -1;
      const cancelTime = Date.now();
      const updated = await prisma.paymeTransaction.update({
        where: { id: tx.id },
        data: { state: newState, cancelTime: BigInt(cancelTime), reason: params.reason },
      });

      if (newState === -2) {
        // To'lov qaytarildi — buyurtmani "failed" deb belgilaymiz, admin qaror qabul qiladi
        await prisma.order.update({ where: { id: tx.orderId }, data: { paymentStatus: "failed" } });
      }

      return ok({ cancel_time: cancelTime, transaction: updated.id, state: updated.state });
    }

    if (method === "CheckTransaction") {
      const tx = await prisma.paymeTransaction.findUnique({ where: { id: params.id } });
      if (!tx) return fail(PAYME_ERROR.TRANSACTION_NOT_FOUND, "Transaction not found");
      return ok({
        create_time: Number(tx.createTime),
        perform_time: Number(tx.performTime),
        cancel_time: Number(tx.cancelTime),
        transaction: tx.id,
        state: tx.state,
        reason: tx.reason ?? null,
      });
    }

    if (method === "GetStatement") {
      const txs = await prisma.paymeTransaction.findMany({
        where: { createTime: { gte: BigInt(params.from), lte: BigInt(params.to) } },
      });
      return ok({
        transactions: txs.map((tx) => ({
          id: tx.id,
          create_time: Number(tx.createTime),
          perform_time: Number(tx.performTime),
          cancel_time: Number(tx.cancelTime),
          transaction: tx.id,
          state: tx.state,
          reason: tx.reason ?? null,
          amount: tx.amount,
          account: { order_id: String(tx.orderId) },
        })),
      });
    }

    return fail(PAYME_ERROR.METHOD_NOT_FOUND, "Method not found");
  } catch (err) {
    if (err.code) {
      return fail(err.code, err.message);
    }
    console.error("Payme webhook xatosi:", err);
    return fail(-32400, "Internal error");
  }
});

module.exports = router;
