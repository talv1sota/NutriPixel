import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Move food logs from April 10 to April 9
  await prisma.foodLog.updateMany({
    where: { date: "2026-04-10" },
    data: { date: "2026-04-09" },
  });

  // Move weight entry from April 10 to April 9
  // Delete if April 9 already exists, then update
  await prisma.weightEntry.deleteMany({ where: { date: "2026-04-09" } });
  await prisma.weightEntry.updateMany({
    where: { date: "2026-04-10" },
    data: { date: "2026-04-09" },
  });

  console.log("Moved April 10 data to April 9");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
