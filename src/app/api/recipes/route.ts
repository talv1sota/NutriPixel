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

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const recipe = await prisma.recipe.findFirst({ where: { id: body.id, userId: session.userId } });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ingredients = body.ingredients != null
    ? (Array.isArray(body.ingredients) ? body.ingredients.join("\n") : String(body.ingredients))
    : undefined;
  const instructions = body.instructions != null
    ? (Array.isArray(body.instructions) ? body.instructions.join("\n") : String(body.instructions))
    : undefined;

  const updated = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      ...(body.title != null && { title: body.title }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl || null }),
      ...(body.image !== undefined && { image: body.image || null }),
      ...(body.servings !== undefined && { servings: body.servings || null }),
      ...(body.prepTime !== undefined && { prepTime: body.prepTime || null }),
      ...(body.cookTime !== undefined && { cookTime: body.cookTime || null }),
      ...(body.totalTime !== undefined && { totalTime: body.totalTime || null }),
      ...(ingredients !== undefined && { ingredients }),
      ...(instructions !== undefined && { instructions }),
      ...(body.calories !== undefined && { calories: body.calories ?? null }),
      ...(body.protein !== undefined && { protein: body.protein ?? null }),
      ...(body.carbs !== undefined && { carbs: body.carbs ?? null }),
      ...(body.fat !== undefined && { fat: body.fat ?? null }),
      ...(body.fiber !== undefined && { fiber: body.fiber ?? null }),
      ...(body.sugar !== undefined && { sugar: body.sugar ?? null }),
    },
  });
  return NextResponse.json(updated);
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
