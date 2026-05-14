import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("q") || "";
  // Visibility: global foods + this user's custom foods. Skip shadow Recipe rows.
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
      return NextResponse.json({ error: "Cannot remove a global or another user's food" }, { status: 403 });
    }

    // Remove any recurring entries pointing at this food so the food row can
    // be deleted cleanly. Historical logs are snapshotted (below) and survive.
    await prisma.recurringFoodLog.deleteMany({ where: { foodId: id, userId: session.userId } });

    // Snapshot the food's macros onto every log that references it, then null
    // out foodId so we can hard-delete without breaking the FK. Each log keeps
    // its original macros forever — independent of the live Food table.
    const refs = await prisma.foodLog.findMany({ where: { foodId: id }, select: { id: true } });
    for (const r of refs) {
      await prisma.foodLog.update({
        where: { id: r.id },
        data: {
          foodId: null,
          snapshotName: food.name,
          snapshotBrand: food.brand,
          snapshotCalories: food.calories,
          snapshotProtein: food.protein,
          snapshotCarbs: food.carbs,
          snapshotFat: food.fat,
          snapshotFiber: food.fiber,
          snapshotSugar: food.sugar,
          snapshotServing: food.serving,
          snapshotUnit: food.unit,
        },
      });
    }
    await prisma.food.delete({ where: { id } });
    return NextResponse.json({ success: true, snapshotted: refs.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[/api/foods DELETE] failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
