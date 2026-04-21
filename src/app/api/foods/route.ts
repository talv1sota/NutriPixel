import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q") || "";
  // Exclude shadow foods created to back recipe logs
  const notRecipe = { NOT: { brand: "Recipe" } };
  const foods = await prisma.food.findMany({
    where: search
      ? { AND: [{ name: { contains: search } }, notRecipe] }
      : notRecipe,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(foods);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    },
  });
  return NextResponse.json(food);
}
