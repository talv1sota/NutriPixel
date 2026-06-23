import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resolveFood } from "@/lib/foodLogs";
import { buildPool, RawLog } from "@/lib/daySuggest";

// Building blocks for the Suggested Days generator, derived from what the user
// has logged before. buildPool() handles aggregation, category classification
// (drink/dessert/food/alcohol), meal placement, and the recent-day totals.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.foodLog.findMany({
    where: { userId: session.userId },
    include: { food: true },
    orderBy: { createdAt: "desc" }, // newest first → first seen per key is most recent
  });

  const raw: RawLog[] = logs.map((l) => {
    const f = resolveFood({ ...l, food: l.food });
    return {
      name: f.name, brand: f.brand, foodId: l.foodId ?? null,
      per100: { calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, sugar: f.sugar },
      amount: l.amount, unit: f.unit, meal: l.meal, date: l.date,
    };
  });

  return NextResponse.json(buildPool(raw));
}
