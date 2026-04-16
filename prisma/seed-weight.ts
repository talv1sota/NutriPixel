import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userIdArg = process.argv[2];
  const userId = userIdArg ? parseInt(userIdArg, 10) : 1;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User with id ${userId} not found. Sign up first, then run: npx tsx prisma/seed-weight.ts <userId>`);
    process.exit(1);
  }

  // Weight entries
  const entries = [
    { weight: 136, date: "2026-04-06" },
    { weight: 135.6, date: "2026-04-07" },
    { weight: 135.4, date: "2026-04-08" },
    { weight: 135, date: "2026-04-10" },
  ];

  for (const e of entries) {
    await prisma.weightEntry.upsert({
      where: { userId_date: { userId, date: e.date } },
      update: { weight: e.weight },
      create: { userId, ...e },
    });
  }

  // Set goal weight to 125
  const goal = await prisma.goal.findFirst({ where: { userId } });
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
