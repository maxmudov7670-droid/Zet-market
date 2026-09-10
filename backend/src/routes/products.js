const express = require("express");
const prisma = require("../lib/prisma");
const { requireAdminAuth } = require("../middleware/adminAuth");

const router = express.Router();

const VALID_UNITS = ["dona", "kg", "litr"];

// GET /api/products?all=true  -> admin panel uchun barcha (nofaol ham) mahsulotlar (parol talab qilinadi)
// GET /api/products            -> mini app uchun faqat faol mahsulotlar (ochiq)
router.get("/", async (req, res, next) => {
  const showAll = req.query.all === "true";
  if (showAll) return requireAdminAuth(req, res, next);
  next();
}, async (req, res) => {
  try {
    const showAll = req.query.all === "true";
    const products = await prisma.product.findMany({
      where: showAll ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mahsulotlarni olishda xatolik" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!product) return res.status(404).json({ error: "Mahsulot topilmadi" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Xatolik yuz berdi" });
  }
});

// POST /api/products  (Admin Panel: yangi mahsulot qo'shish)
router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const { name, description, imageUrl, oldPrice, newPrice, unit, category, isActive } = req.body;

    if (!name || !newPrice) {
      return res.status(400).json({ error: "Nomi va yangi narxi majburiy" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        oldPrice: oldPrice ? Number(oldPrice) : null,
        newPrice: Number(newPrice),
        unit: VALID_UNITS.includes(unit) ? unit : "dona",
        category: category || "Oziq-ovqat",
        isActive: isActive === undefined ? true : Boolean(isActive),
      },
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mahsulot qo'shishda xatolik" });
  }
});

// PUT /api/products/:id  (Admin Panel: tahrirlash)
router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { name, description, imageUrl, oldPrice, newPrice, unit, category, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(oldPrice !== undefined && { oldPrice: oldPrice === null ? null : Number(oldPrice) }),
        ...(newPrice !== undefined && { newPrice: Number(newPrice) }),
        ...(unit !== undefined && { unit: VALID_UNITS.includes(unit) ? unit : "dona" }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mahsulotni yangilashda xatolik" });
  }
});

// DELETE /api/products/:id  (Admin Panel: o'chirish)
router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mahsulotni o'chirishda xatolik" });
  }
});

module.exports = router;
