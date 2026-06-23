import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resolveFood } from "@/lib/foodLogs";

// Returns the building blocks the Suggested Days generator needs, derived
// entirely from what the user has logged before:
//  - pool:       distinct foods they've eaten, with typical amount + per-100g
//                macros + the meal they usually eat it at + how often (freq).
//  - mealDist:   share of calories per meal across history (to split a target).
//  - recentDays: last 7 logged days' calorie totals (weekly-average context).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.foodLog.findMany({
    where: { userId: session.userId },
    include: { food: true },
    orderBy: { createdAt: "desc" }, // newest first → first seen per key is most recent
  });

  type Acc = {
    name: string; brand: string | null; foodId: number | null;
    per100: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number };
    amount: number; unit: string; mealCounts: Record<string, number>; freq: number;
  };
  const byKey = new Map<string, Acc>();
  const mealCal: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  let totalCal = 0;

  for (const l of logs) {
    const f = resolveFood({ ...l, food: l.food });
    const cals = (f.calories * l.amount) / 100;
    mealCal[l.meal] = (mealCal[l.meal] || 0) + cals;
    byDate[l.date] = (byDate[l.date] || 0) + cals;
    totalCal += cals;

    if (!f.name || l.meal === "supplement") continue; // supplements aren't food choices
    const key = `${f.name}|${f.brand ?? ""}`.toLowerCase();
    let e = byKey.get(key);
    if (!e) {
      e = {
        name: f.name, brand: f.brand, foodId: l.foodId ?? null,
        per100: { calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, sugar: f.sugar },
        amount: l.amount, unit: f.unit, mealCounts: {}, freq: 0,
      };
      byKey.set(key, e);
    }
    e.freq++;
    e.mealCounts[l.meal] = (e.mealCounts[l.meal] || 0) + 1;
    if (l.foodId != null && e.foodId == null) e.foodId = l.foodId; // prefer a real Food id when available
  }

  const pool = [...byKey.values()]
    .map((e) => {
      const meal = Object.entries(e.mealCounts).sort((a, b) => b[1] - a[1])[0][0];
      const cals = Math.round((e.per100.calories * e.amount) / 100);
      return {
        name: e.name, brand: e.brand, foodId: e.foodId, meal,
        amount: Math.round(e.amount), unit: e.unit, per100: e.per100, freq: e.freq, cals,
      };
    })
    .filter((p) => p.cals >= 5); // drop near-zero items

  const MEALS = ["breakfast", "lunch", "dinner", "snack", "dessert"];
  const mealDist: Record<string, number> = {};
  for (const m of MEALS) mealDist[m] = totalCal > 0 ? (mealCal[m] || 0) / totalCal : 0;

  const recentDays = Object.entries(byDate)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 7)
    .map(([date, calories]) => ({ date, calories: Math.round(calories) }));

  return NextResponse.json({ pool, mealDist, recentDays });
}
