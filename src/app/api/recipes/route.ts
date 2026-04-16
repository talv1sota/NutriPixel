import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipes = await prisma.recipe.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ingredients = Array.isArray(body.ingredients)
    ? body.ingredients.join("\n")
    : String(body.ingredients || "");
  const instructions = Array.isArray(body.instructions)
    ? body.instructions.join("\n")
    : String(body.instructions || "");

  if (!body.title || !ingredients || !instructions) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      userId: session.userId,
      title: body.title,
      description: body.description || null,
      sourceUrl: body.sourceUrl || null,
      image: body.image || null,
      servings: body.servings || null,
      prepTime: body.prepTime || null,
      cookTime: body.cookTime || null,
      totalTime: body.totalTime || null,
      ingredients,
      instructions,
      calories: body.calories ?? null,
      protein: body.protein ?? null,
      carbs: body.carbs ?? null,
      fat: body.fat ?? null,
      fiber: body.fiber ?? null,
      sugar: body.sugar ?? null,
    },
  });
  return NextResponse.json(recipe);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const recipe = await prisma.recipe.findFirst({ where: { id: parseInt(id), userId: session.userId } });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recipe.delete({ where: { id: recipe.id } });
  return NextResponse.json({ success: true });
}
