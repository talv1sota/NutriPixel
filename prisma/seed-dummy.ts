import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // This script requires a user to exist. Pass userId as CLI arg or default to 1.
  const userIdArg = process.argv[2];
  const userId = userIdArg ? parseInt(userIdArg, 10) : 1;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User with id ${userId} not found. Sign up first, then run: npx tsx prisma/seed-dummy.ts <userId>`);
    process.exit(1);
  }

  // Add missing foods
  const newFoods = [
    { name: "Ground Turkey", brand: "Generic", calories: 170, protein: 21, carbs: 0, fat: 9, fiber: 0, sugar: 0, serving: 454, unit: "g" },
    { name: "Sprite Zero", brand: "Coca-Cola", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving: 355, unit: "ml" },
    { name: "Espresso", brand: "Generic", calories: 5, protein: 0.3, carbs: 0.5, fat: 0.2, fiber: 0, sugar: 0, serving: 30, unit: "ml" },
    { name: "Whey Protein (1 scoop)", brand: "Generic", calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 1, serving: 33, unit: "g" },
    { name: "Better Than Bouillon", brand: "BTB", calories: 15, protein: 1, carbs: 2, fat: 0.5, fiber: 0, sugar: 1, serving: 16, unit: "g" },
    { name: "Konjac Jelly", brand: "Generic", calories: 10, protein: 0, carbs: 3, fat: 0, fiber: 2, sugar: 1, serving: 150, unit: "g" },
    { name: "Chicken Thigh w/ Marinade", brand: "Homemade", calories: 230, protein: 26, carbs: 4, fat: 12, fiber: 0, sugar: 2, serving: 150, unit: "g" },
    { name: "Ice Cream Cone (1 scoop)", brand: "Generic", calories: 250, protein: 4, carbs: 35, fat: 11, fiber: 0.5, sugar: 24, serving: 100, unit: "g" },
    { name: "Shrimp in Butter Sauce", brand: "Homemade", calories: 180, protein: 20, carbs: 2, fat: 10, fiber: 0, sugar: 0, serving: 150, unit: "g" },
    { name: "Kimchi", brand: "Generic", calories: 23, protein: 1.3, carbs: 4, fat: 0.5, fiber: 1.6, sugar: 1.5, serving: 75, unit: "g" },
  ];

  const createdFoods: Record<string, number> = {};

  for (const f of newFoods) {
    const existing = await prisma.food.findFirst({ where: { name: f.name } });
    if (existing) {
      createdFoods[f.name] = existing.id;
    } else {
      const created = await prisma.food.create({ data: f });
      createdFoods[f.name] = created.id;
    }
  }

  // Also grab existing foods we need
  const existingNames = ["Banana", "Spinach (raw)", "Pasta (cooked)"];
  for (const name of existingNames) {
    const f = await prisma.food.findFirst({ where: { name } });
    if (f) createdFoods[name] = f.id;
  }

  // Helper
  const log = (foodName: string, amount: number, meal: string, date: string) => ({
    userId,
    foodId: createdFoods[foodName],
    amount,
    meal,
    date,
  });

  // Day 1 — April 6
  const day1 = [
    log("Ground Turkey", 454, "dinner", "2026-04-06"),
    log("Sprite Zero", 355, "dinner", "2026-04-06"),
    log("Espresso", 60, "breakfast", "2026-04-06"),
  ];

  // Day 2 — April 7
  const day2 = [
    log("Ground Turkey", 454, "dinner", "2026-04-07"),
    log("Spinach (raw)", 60, "dinner", "2026-04-07"),
    log("Better Than Bouillon", 16, "dinner", "2026-04-07"),
    log("Banana", 120, "snack", "2026-04-07"),
    log("Whey Protein (1 scoop)", 33, "breakfast", "2026-04-07"),
  ];

  // Day 3 — April 8
  const day3 = [
    log("Whey Protein (1 scoop)", 33, "breakfast", "2026-04-08"),
    log("Banana", 120, "snack", "2026-04-08"),
    log("Konjac Jelly", 150, "snack", "2026-04-08"),
    log("Chicken Thigh w/ Marinade", 300, "dinner", "2026-04-08"),
    log("Better Than Bouillon", 16, "dinner", "2026-04-08"),
    log("Spinach (raw)", 60, "dinner", "2026-04-08"),
  ];

  // Day 4 — April 10
  const day4 = [
    log("Espresso", 60, "breakfast", "2026-04-10"),
    log("Ice Cream Cone (1 scoop)", 100, "snack", "2026-04-10"),
    log("Shrimp in Butter Sauce", 200, "dinner", "2026-04-10"),
    log("Pasta (cooked)", 100, "dinner", "2026-04-10"),
    log("Better Than Bouillon", 16, "dinner", "2026-04-10"),
    log("Spinach (raw)", 60, "dinner", "2026-04-10"),
    log("Kimchi", 75, "dinner", "2026-04-10"),
    log("Sprite Zero", 355, "dinner", "2026-04-10"),
  ];

  const allLogs = [...day1, ...day2, ...day3, ...day4];

  for (const entry of allLogs) {
    if (!entry.foodId) {
      console.error("Missing food ID for entry:", entry);
      continue;
    }
    await prisma.foodLog.create({ data: entry });
  }

  console.log(`Created ${allLogs.length} food log entries across 4 days`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
