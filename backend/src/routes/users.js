const express = require("express");
const prisma = require("../lib/prisma");
const { requireTelegramAuth } = require("../middleware/telegramAuth");

const router = express.Router();

/**
 * POST /api/users/sync
 * Mini App ochilganda chaqiriladi: Telegram initData tekshiriladi va
 * shu foydalanuvchi bazada bo'lmasa yaratiladi, bo'lsa ismi yangilanadi.
 */
router.post("/sync", requireTelegramAuth, async (req, res) => {
  try {
    const tgUser = req.telegramUser;
    const telegramId = String(tgUser.id);

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        username: tgUser.username || null,
      },
      create: {
        telegramId,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        username: tgUser.username || null,
      },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Foydalanuvchini sinxronlashda xatolik" });
  }
});

module.exports = router;
