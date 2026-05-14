import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { resolveFood } from "@/lib/foodLogs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const logs = await prisma.foodLog.findMany({
    where: { userId: session.userId, date },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(logs.map(l => ({ ...l, food: resolveFood(l) })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (typeof body.foodId !== "number") {
      return NextResponse.json({ error: `Invalid foodId: ${JSON.stringify(body.foodId)}` }, { status: 400 });
    }
    if (typeof body.amount !== "number" || !isFinite(body.amount) || body.amount <= 0) {
      return NextResponse.json({ error: `Invalid amount: ${JSON.stringify(body.amount)}` }, { status: 400 });
    }
    if (!body.meal || !body.date) {
      return NextResponse.json({ error: `Missing meal or date` }, { status: 400 });
    }
    // Note: avoid `include` on create — Prisma 6 wraps it in a transaction,
    // which the Neon HTTP adapter rejects. Re-fetch the food separately.
    const log = await prisma.foodLog.create({
      data: {
        userId: session.userId,
        foodId: body.foodId,
        amount: body.amount,
        meal: body.meal,
        date: body.date,
      },
    });
    const food = await prisma.food.findUnique({ where: { id: body.foodId } });
    return NextResponse.json({ ...log, food });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/logs POST] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idParam = req.nextUrl.searchParams.get("id");
  if (!idParam) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const id = parseInt(idParam, 10);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const log = await prisma.foodLog.findFirst({ where: { id, userId: session.userId } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await req.json();
    const data: { amount?: number; meal?: string; date?: string } = {};
    if (typeof body.amount === "number" && isFinite(body.amount) && body.amount > 0) {
      data.amount = body.amount;
    }
    if (typeof body.meal === "string" && body.meal) data.meal = body.meal;
    if (typeof body.date === "string" && body.date) data.date = body.date;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.foodLog.update({ where: { id }, data });
    const food = updated.foodId ? await prisma.food.findUnique({ where: { id: updated.foodId } }) : null;
    return NextResponse.json({ ...updated, food });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/logs PATCH] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Verify ownership before deleting
  const log = await prisma.foodLog.findFirst({ where: { id: parseInt(id), userId: session.userId } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.foodLog.delete({ where: { id: log.id } });
  return NextResponse.json({ success: true });
}
