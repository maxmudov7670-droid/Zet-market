const { PrismaClient } = require("@prisma/client");

// Butun ilova bo'ylab bitta PrismaClient instansiyasi ishlatiladi
const prisma = new PrismaClient();

module.exports = prisma;
