import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.recurringFoodLog.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });
  const foodIds = Array.from(new Set(rows.map(r => r.foodId)));
  const foods = foodIds.length
    ? await prisma.food.findMany({ where: { id: { in: foodIds } } })
    : [];
  const foodById = new Map(foods.map(f => [f.id, f]));
  return NextResponse.json(
    rows.map(r => ({ ...r, food: foodById.get(r.foodId) ?? null })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (typeof body.foodId !== "number") {
      return NextResponse.json({ error: "foodId required" }, { status: 400 });
    }
    if (typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
    }
    if (!body.meal) {
      return NextResponse.json({ error: "meal required" }, { status: 400 });
    }
    const row = await prisma.recurringFoodLog.upsert({
      where: {
        userId_foodId_meal: {
          userId: session.userId,
          foodId: body.foodId,
          meal: body.meal,
        },
      },
      update: { amount: body.amount, active: true },
      create: {
        userId: session.userId,
        foodId: body.foodId,
        amount: body.amount,
        meal: body.meal,
      },
    });
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/recurring POST] failed:", msg);
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

  const row = await prisma.recurringFoodLog.findFirst({
    where: { id, userId: session.userId },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recurringFoodLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
