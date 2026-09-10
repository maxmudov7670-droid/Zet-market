const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Namuna uchun mahalla oziq-ovqat do'koni assortimenti — turli kategoriya va
// o'lchov birliklari (dona / kg / litr) aralashmasi bilan. Rasmlar ataylab
// bo'sh qoldirilgan: bular haqiqiy mahsulotlaringiz emas, shuning uchun
// Admin Panelning "Galereyadan tanlash" funksiyasi orqali o'zingiz haqiqiy
// suratlarni yuklaysiz.
const products = [
  // Non va nonvoyachilik
  {
    name: "Oddiy non",
    description: "Har kuni yangi yopiladi\n1 dona",
    oldPrice: null,
    newPrice: 4000,
    unit: "dona",
    category: "Non va nonvoyachilik",
    sortOrder: 1,
  },
  {
    name: "Bulochka",
    description: "Shirin bulochka\n1 dona",
    oldPrice: null,
    newPrice: 3000,
    unit: "dona",
    category: "Non va nonvoyachilik",
    sortOrder: 2,
  },

  // Sut mahsulotlari
  {
    name: "Sut",
    description: "Pasterizatsiyalangan\nYog'liligi 3.2%",
    oldPrice: 14000,
    newPrice: 12000,
    unit: "litr",
    category: "Sut mahsulotlari",
    sortOrder: 3,
  },
  {
    name: "Qatiq",
    description: "Tabiiy, qo'shimchasiz\n0.5 litr shisha",
    oldPrice: null,
    newPrice: 8000,
    unit: "dona",
    category: "Sut mahsulotlari",
    sortOrder: 4,
  },
  {
    name: "Tvorog",
    description: "Yog'liligi 9%\nUy sharoitida tayyorlangandek",
    oldPrice: null,
    newPrice: 35000,
    unit: "kg",
    category: "Sut mahsulotlari",
    sortOrder: 5,
  },
  {
    name: "Tuxum",
    description: "Fermer xo'jaligidan\n1-toifa",
    oldPrice: null,
    newPrice: 1500,
    unit: "dona",
    category: "Sut mahsulotlari",
    sortOrder: 6,
  },
  {
    name: "Sariyog'",
    description: "82.5% yog'lilik\n180 gr qadoq",
    oldPrice: 32000,
    newPrice: 28000,
    unit: "dona",
    category: "Sut mahsulotlari",
    sortOrder: 7,
  },

  // Meva va sabzavot
  {
    name: "Olma",
    description: "Mahalliy hosil\nQizil navi",
    oldPrice: null,
    newPrice: 18000,
    unit: "kg",
    category: "Meva va sabzavot",
    sortOrder: 8,
  },
  {
    name: "Banan",
    description: "Import\nSarg'aygan, yeyishga tayyor",
    oldPrice: null,
    newPrice: 25000,
    unit: "kg",
    category: "Meva va sabzavot",
    sortOrder: 9,
  },
  {
    name: "Pomidor",
    description: "Yangi uzilgan\nMahalliy issiqxonadan",
    oldPrice: 15000,
    newPrice: 12000,
    unit: "kg",
    category: "Meva va sabzavot",
    sortOrder: 10,
  },
  {
    name: "Bodring",
    description: "Issiqxona bodringi\nXo'shtor va shirador",
    oldPrice: null,
    newPrice: 10000,
    unit: "kg",
    category: "Meva va sabzavot",
    sortOrder: 11,
  },
  {
    name: "Kartoshka",
    description: "Mahalliy hosil\nSalat va qovurish uchun mos",
    oldPrice: null,
    newPrice: 6000,
    unit: "kg",
    category: "Meva va sabzavot",
    sortOrder: 12,
  },
  {
    name: "Piyoz",
    description: "Sariq piyoz\nUzoq saqlanadi",
    oldPrice: null,
    newPrice: 4000,
    unit: "kg",
    category: "Meva va sabzavot",
    sortOrder: 13,
  },

  // Go'sht mahsulotlari
  {
    name: "Mol go'shti",
    description: "Yangi so'yilgan\nQovurdoq uchun mos",
    oldPrice: null,
    newPrice: 95000,
    unit: "kg",
    category: "Go'sht mahsulotlari",
    sortOrder: 14,
  },
  {
    name: "Tovuq go'shti",
    description: "Fermer xo'jaligidan\nButun tovuq",
    oldPrice: 50000,
    newPrice: 45000,
    unit: "kg",
    category: "Go'sht mahsulotlari",
    sortOrder: 15,
  },

  // Don va yormalar
  {
    name: "Guruch",
    description: "Laziza navi\nOsh uchun eng mos",
    oldPrice: null,
    newPrice: 16000,
    unit: "kg",
    category: "Don va yormalar",
    sortOrder: 16,
  },
  {
    name: "Un",
    description: "Oliy nav bug'doy uni",
    oldPrice: null,
    newPrice: 8500,
    unit: "kg",
    category: "Don va yormalar",
    sortOrder: 17,
  },
  {
    name: "Shakar",
    description: "Oq shakar qand",
    oldPrice: null,
    newPrice: 9000,
    unit: "kg",
    category: "Don va yormalar",
    sortOrder: 18,
  },
  {
    name: "Osh yog'i",
    description: "Kungaboqar yog'i\n1 litr shisha",
    oldPrice: 24000,
    newPrice: 22000,
    unit: "litr",
    category: "Don va yormalar",
    sortOrder: 19,
  },

  // Ichimliklar
  {
    name: "Mineral suv",
    description: "Gazlangan\n1.5 litr",
    oldPrice: null,
    newPrice: 5000,
    unit: "dona",
    category: "Ichimliklar",
    sortOrder: 20,
  },
  {
    name: "Coca-Cola",
    description: "1.5 litr shisha",
    oldPrice: null,
    newPrice: 12000,
    unit: "dona",
    category: "Ichimliklar",
    sortOrder: 21,
  },

  // Maishiy kimyo
  {
    name: "Idish yuvish suyuqligi",
    description: "500 ml\nLimon hidli",
    oldPrice: null,
    newPrice: 18000,
    unit: "dona",
    category: "Maishiy kimyo",
    sortOrder: 22,
  },
  {
    name: "Kir yuvish kukuni",
    description: "3 kg qadoq\nAvtomat mashinalar uchun",
    oldPrice: 36000,
    newPrice: 32000,
    unit: "dona",
    category: "Maishiy kimyo",
    sortOrder: 23,
  },
];

// Bosh sahifadagi aylanma bezaklar — ba'zilari (Yangi/Aksiya/TOP) filtrsiz,
// qolganlari tegishli kategoriyaga bosilganda katalogni avtomatik filtrlaydi.
const stories = [
  { emoji: "🔥", label: "Yangi", category: null, sortOrder: 1 },
  { emoji: "🎉", label: "Aksiya", category: null, sortOrder: 2 },
  { emoji: "🥦", label: "Meva-sabzavot", category: "Meva va sabzavot", sortOrder: 3 },
  { emoji: "🥩", label: "Go'sht", category: "Go'sht mahsulotlari", sortOrder: 4 },
  { emoji: "🥛", label: "Sut mahsulotlari", category: "Sut mahsulotlari", sortOrder: 5 },
  { emoji: "🧴", label: "Maishiy kimyo", category: "Maishiy kimyo", sortOrder: 6 },
];

async function main() {
  console.log("Seeding boshlandi...");

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      console.log(`"${product.name}" allaqachon mavjud, o'tkazib yuborildi.`);
      continue;
    }
    await prisma.product.create({ data: product });
    console.log(`"${product.name}" qo'shildi.`);
  }

  for (const story of stories) {
    const existing = await prisma.homeStory.findFirst({ where: { label: story.label } });
    if (existing) {
      console.log(`Bezak "${story.label}" allaqachon mavjud, o'tkazib yuborildi.`);
      continue;
    }
    await prisma.homeStory.create({ data: story });
    console.log(`Bezak "${story.label}" qo'shildi.`);
  }

  console.log("Seeding tugadi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
