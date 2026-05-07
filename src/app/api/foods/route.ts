import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("q") || "";
  // Visibility: global foods (userId IS NULL) + this user's custom foods.
  // Exclude shadow foods created to back recipe logs.
  const visibility = {
    AND: [
      { NOT: { brand: "Recipe" } },
      { OR: [{ userId: null }, { userId: session.userId }] },
    ],
  };
  const foods = await prisma.food.findMany({
    where: search
      ? { AND: [{ name: { contains: search } }, visibility] }
      : visibility,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(foods);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || body.calories == null) {
      return NextResponse.json({ error: "Name and calories required" }, { status: 400 });
    }
    const food = await prisma.food.create({
      data: {
        name: body.name,
        brand: body.brand || "Custom",
        calories: body.calories,
        protein: body.protein ?? 0,
        carbs: body.carbs ?? 0,
        fat: body.fat ?? 0,
        fiber: body.fiber ?? 0,
        sugar: body.sugar ?? 0,
        serving: body.serving ?? 100,
        unit: body.unit ?? "g",
        userId: session.userId,
      },
    });
    return NextResponse.json(food);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/foods POST] failed:", msg);
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

  try {
    const food = await prisma.food.findUnique({ where: { id } });
    if (!food) return NextResponse.json({ error: "Food not found" }, { status: 404 });
    if (food.userId !== session.userId) {
      return NextResponse.json({ error: "Cannot delete a global or another user's food" }, { status: 403 });
    }

    const force = req.nextUrl.searchParams.get("force") === "1";
    const refs = await prisma.foodLog.count({ where: { foodId: id } });
    if (refs > 0 && !force) {
      return NextResponse.json(
        { error: `This food has ${refs} log entries. Add ?force=1 to delete it and its logs.`, logCount: refs },
        { status: 409 },
      );
    }
    if (refs > 0) {
      await prisma.foodLog.deleteMany({ where: { foodId: id } });
    }
    await prisma.food.delete({ where: { id } });
    return NextResponse.json({ success: true, deletedLogs: refs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/foods DELETE] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
