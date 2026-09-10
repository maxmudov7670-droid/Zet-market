const express = require("express");
const prisma = require("../lib/prisma");
const { requireAdminAuth } = require("../middleware/adminAuth");

const router = express.Router();

// GET /api/stories        — Mini App: faqat faol bezaklarni tartib bo'yicha
//                            qaytaradi (ochiq, autentifikatsiyasiz)
// GET /api/stories?all=true — Admin Panel: hammasini (nofaollarni ham)
//                            qaytaradi, admin parolini talab qiladi
router.get(
  "/",
  async (req, res, next) => {
    const showAll = req.query.all === "true";
    if (showAll) return requireAdminAuth(req, res, next);
    next();
  },
  async (req, res) => {
    try {
      const showAll = req.query.all === "true";
      const stories = await prisma.homeStory.findMany({
        where: showAll ? {} : { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      res.json(stories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Bezaklarni olishda xatolik" });
    }
  }
);

// POST /api/stories — yangi bezak qo'shish (Admin Panel)
router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const { emoji, label, category, sortOrder, isActive } = req.body;
    if (!emoji || !String(emoji).trim() || !label || !String(label).trim()) {
      return res.status(400).json({ error: "Emoji va nomi majburiy" });
    }

    const story = await prisma.homeStory.create({
      data: {
        emoji: String(emoji).trim(),
        label: String(label).trim(),
        category: category && String(category).trim() ? String(category).trim() : null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    res.status(201).json(story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bezak qo'shishda xatolik" });
  }
});

// PUT /api/stories/:id — bezakni tahrirlash (Admin Panel)
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { emoji, label, category, sortOrder, isActive } = req.body;
    const story = await prisma.homeStory.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(emoji !== undefined && { emoji: String(emoji).trim() }),
        ...(label !== undefined && { label: String(label).trim() }),
        ...(category !== undefined && {
          category: category && String(category).trim() ? String(category).trim() : null,
        }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) || 0 }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    res.json(story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bezakni yangilashda xatolik" });
  }
});

// DELETE /api/stories/:id — bezakni o'chirish (Admin Panel)
router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    await prisma.homeStory.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bezakni o'chirishda xatolik" });
  }
});

module.exports = router;
