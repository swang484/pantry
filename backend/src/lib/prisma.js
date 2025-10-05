const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances in dev with hot reload
let prisma;
if (!global.__prisma) {
  global.__prisma = new PrismaClient();
}
prisma = global.__prisma;

module.exports = { prisma };
