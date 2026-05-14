import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

// Idempotent reconciler: for each active recurring entry whose lastRunDate is
// not today, create today's FoodLog and stamp lastRunDate. Safe to call on
// every page load.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const pending = await prisma.recurringFoodLog.findMany({
    where: {
      userId: session.userId,
      active: true,
      OR: [{ lastRunDate: null }, { NOT: { lastRunDate: today } }],
    },
  });

  let created = 0;
  for (const r of pending) {
    await prisma.foodLog.create({
      data: {
        userId: session.userId,
        foodId: r.foodId,
        amount: r.amount,
        meal: r.meal,
        date: today,
      },
    });
    await prisma.recurringFoodLog.update({
      where: { id: r.id },
      data: { lastRunDate: today },
    });
    created++;
  }
  return NextResponse.json({ created });
}
