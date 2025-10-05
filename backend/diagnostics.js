#!/usr/bin/env node
console.log('==== Pantry Backend Diagnostics ====' );
console.log('Node version:', process.version);
console.log('Platform:', process.platform, process.arch);
console.log('DATABASE_URL:', process.env.DATABASE_URL || '(not set)');

(async () => {
  let prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    console.log('[OK] @prisma/client loaded');
  } catch (e) {
    console.error('[FAIL] Unable to load @prisma/client:', e.message);
    process.exit(1);
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[OK] Simple DB query succeeded');
  } catch (e) {
    console.error('[FAIL] DB connectivity / query error:', e.message);
  }
  try {
    const fs = require('fs');
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
      const filePath = process.env.DATABASE_URL.replace('file:', '').replace(/^\.\//,'');
      if (fs.existsSync(filePath)) {
        console.log('[OK] SQLite file exists:', filePath);
      } else {
        console.warn('[WARN] SQLite file not found at', filePath);
      }
    }
  } catch (e) {}
  await prisma.$disconnect();
})();
