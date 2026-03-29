const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        name: "Test User " + Date.now(),
        email: "test" + Date.now() + "@example.com"
      }
    });
    console.log("Success:", user.id);
  } catch (e) {
    console.error("Error creating user:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
