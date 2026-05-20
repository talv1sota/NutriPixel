import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Toggle the user's unit system and convert every weight/height value the
// user has saved so the displayed numbers actually match the new units. Past
// weight entries are rewritten in-place — the only place that stores units
// is the goal row, so once that row plus the entries are converted, the
// whole site is consistent.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const target: "metric" | "imperial" | undefined = body.system;
  if (target !== "metric" && target !== "imperial") {
    return NextResponse.json({ error: "system must be 'metric' or 'imperial'" }, { status: 400 });
  }

  // Ensure a goal row exists so we can read the current units.
  let goal = await prisma.goal.findFirst({ where: { userId: session.userId } });
  if (!goal) {
    goal = await prisma.goal.create({ data: { userId: session.userId } });
  }
  const currentSystem: "metric" | "imperial" =
    goal.unit === "kg" && goal.heightUnit === "cm" ? "metric" : "imperial";

  if (currentSystem === target) {
    // No conversion needed; still normalize the pair so a mixed state
    // (e.g. kg + in) snaps to one consistent system.
    const updated = await prisma.goal.update({
      where: { id: goal.id },
      data: {
        unit: target === "metric" ? "kg" : "lbs",
        heightUnit: target === "metric" ? "cm" : "in",
      },
    });
    return NextResponse.json({ goal: updated, converted: 0 });
  }

  const weightFactor = target === "metric" ? 0.453592 : 2.20462;
  const heightFactor = target === "metric" ? 2.54 : 1 / 2.54;
  const round1 = (v: number) => Math.round(v * 10) / 10;

  const updatedGoal = await prisma.goal.update({
    where: { id: goal.id },
    data: {
      unit: target === "metric" ? "kg" : "lbs",
      heightUnit: target === "metric" ? "cm" : "in",
      targetWeight: goal.targetWeight != null ? round1(goal.targetWeight * weightFactor) : null,
      height: goal.height != null ? round1(goal.height * heightFactor) : null,
    },
  });

  // Convert every WeightEntry one at a time — Prisma 6 + Neon HTTP can't run
  // updateMany inside a transaction wrapper, and per-row updates are fine
  // here because users rarely have many entries.
  const entries = await prisma.weightEntry.findMany({ where: { userId: session.userId } });
  for (const e of entries) {
    await prisma.weightEntry.update({
      where: { id: e.id },
      data: { weight: round1(e.weight * weightFactor) },
    });
  }

  return NextResponse.json({ goal: updatedGoal, converted: entries.length });
}
