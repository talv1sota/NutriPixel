import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Weight entries
  const entries = [
    { weight: 136, date: "2026-04-06" },
    { weight: 135.6, date: "2026-04-07" },
    { weight: 135.4, date: "2026-04-08" },
    { weight: 135, date: "2026-04-10" },
  ];

  for (const e of entries) {
    await prisma.weightEntry.upsert({
      where: { date: e.date },
      update: { weight: e.weight },
      create: e,
    });
  }

  // Set goal weight to 125
  const goal = await prisma.goal.findFirst();
  if (goal) {
    await prisma.goal.update({
      where: { id: goal.id },
      data: { targetWeight: 125, unit: "lbs" },
    });
  }

  console.log("Added 4 weight entries + set goal weight to 125 lbs");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
