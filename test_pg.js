const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
     const count = await prisma.user.count();
     console.log("Database Connection Success! User count is:", count);
  } catch(e) {
     console.error("Prisma Database Adapter Error:", e);
  } finally {
     await prisma.$disconnect();
  }
}
main();
