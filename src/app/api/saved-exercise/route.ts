import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET — list user's saved exercises. Auto-backfill from past Exercise log
// rows the first time the table is empty (so the user inherits anything
// they've already logged).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.savedExercise.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });
  if (existing.length > 0) return NextResponse.json(existing);

  const history = await prisma.exercise.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });
  if (history.length === 0) return NextResponse.json([]);

  // last-write-wins on defaults; most-recent date wins on lastUsedDate
  const byName = new Map<string, { name: string; duration: number; calories: number; date: string }>();
  for (const ex of history) {
    const key = ex.name.trim();
    if (!key) continue;
    byName.set(key, {
      name: key,
      duration: ex.duration,
      calories: ex.caloriesBurned,
      date: ex.date,
    });
  }
  for (const v of byName.values()) {
    await prisma.savedExercise.create({
      data: {
        userId: session.userId,
        name: v.name,
        defaultDuration: v.duration,
        defaultCalories: v.calories,
        lastUsedDate: v.date,
      },
    });
  }
  const backfilled = await prisma.savedExercise.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(backfilled);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });

    const row = await prisma.savedExercise.upsert({
      where: { userId_name: { userId: session.userId, name } },
      update: {
        defaultDuration: typeof body.defaultDuration === "number" ? body.defaultDuration : undefined,
        defaultCalories: typeof body.defaultCalories === "number" ? body.defaultCalories : undefined,
        lastUsedDate: typeof body.lastUsedDate === "string" ? body.lastUsedDate : undefined,
      },
      create: {
        userId: session.userId,
        name,
        defaultDuration: typeof body.defaultDuration === "number" ? body.defaultDuration : 30,
        defaultCalories: typeof body.defaultCalories === "number" ? body.defaultCalories : 0,
        lastUsedDate: typeof body.lastUsedDate === "string" ? body.lastUsedDate : null,
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/saved-exercise POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const idParam = req.nextUrl.searchParams.get("id");
    if (!idParam) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const id = parseInt(idParam, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const row = await prisma.savedExercise.findFirst({ where: { id, userId: session.userId } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const data: { name?: string; defaultDuration?: number; defaultCalories?: number } = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.defaultDuration === "number") data.defaultDuration = body.defaultDuration;
    if (typeof body.defaultCalories === "number") data.defaultCalories = body.defaultCalories;

    const updated = await prisma.savedExercise.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/saved-exercise PATCH]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idParam = req.nextUrl.searchParams.get("id");
  if (!idParam) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const row = await prisma.savedExercise.findFirst({ where: { id, userId: session.userId } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.savedExercise.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
