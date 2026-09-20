const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

prisma
  .$connect()
  .then(() => console.log("Prisma connected successfully"))
  .catch((err) => {
    console.error("Prisma connection failed:", err);
    process.exit(1);
  });

module.exports = prisma;