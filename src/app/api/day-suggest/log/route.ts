import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Logs a whole generated day at once: { date, items: [...] }. Each item is
// either a real Food (foodId + amount + meal) or a snapshot (per-100g macros +
// amount + meal), so it works for the user's snapshot-heavy history.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const date = String(body.date || "");
  const items = Array.isArray(body.items) ? body.items : [];
  if (!date || items.length === 0) {
    return NextResponse.json({ error: "Missing date or items" }, { status: 400 });
  }

  let count = 0;
  for (const it of items) {
    const amount = Number(it.amount);
    const meal = String(it.meal || "snack");
    if (!isFinite(amount) || amount <= 0) continue;

    if (typeof it.foodId === "number") {
      await prisma.foodLog.create({
        data: { userId: session.userId, foodId: it.foodId, amount, meal, date },
      });
    } else {
      await prisma.foodLog.create({
        data: {
          userId: session.userId, foodId: null, amount, meal, date,
          snapshotName: String(it.name ?? "Item"),
          snapshotBrand: it.brand ?? "Estimate",
          snapshotCalories: Number(it.calories ?? 0),
          snapshotProtein: Number(it.protein ?? 0),
          snapshotCarbs: Number(it.carbs ?? 0),
          snapshotFat: Number(it.fat ?? 0),
          snapshotFiber: Number(it.fiber ?? 0),
          snapshotSugar: Number(it.sugar ?? 0),
          snapshotServing: Number(it.serving ?? amount),
          snapshotUnit: String(it.unit ?? "g"),
        },
      });
    }
    count++;
  }

  return NextResponse.json({ success: true, count });
}
