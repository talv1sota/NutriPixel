import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Logs a recipe as a FoodLog by finding or creating a shadow Food row
// (brand="Recipe", unit="serving", serving=100) so 1 serving = amount 100
// and the existing calcMacros(amount/100) math works unchanged.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const recipeId = Number(body.recipeId);
  const servings = Number(body.servings);
  const { meal, date } = body;

  if (!recipeId || !servings || !meal || !date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify the recipe belongs to this user
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, userId: session.userId },
  });
  if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const shadowName = `${recipe.title} (recipe)`;
  let food = await prisma.food.findFirst({
    where: { name: shadowName, brand: "Recipe" },
  });
  if (!food) {
    food = await prisma.food.create({
      data: {
        name: shadowName,
        brand: "Recipe",
        calories: recipe.calories ?? 0,
        protein: recipe.protein ?? 0,
        carbs: recipe.carbs ?? 0,
        fat: recipe.fat ?? 0,
        fiber: recipe.fiber ?? 0,
        sugar: recipe.sugar ?? 0,
        serving: 100,
        unit: "serving",
      },
    });
  } else if (recipe.calories != null && food.calories !== recipe.calories) {
    food = await prisma.food.update({
      where: { id: food.id },
      data: {
        calories: recipe.calories ?? 0,
        protein: recipe.protein ?? 0,
        carbs: recipe.carbs ?? 0,
        fat: recipe.fat ?? 0,
        fiber: recipe.fiber ?? 0,
        sugar: recipe.sugar ?? 0,
      },
    });
  }

  const log = await prisma.foodLog.create({
    data: {
      userId: session.userId,
      foodId: food.id,
      amount: servings * 100,
      meal,
      date,
    },
    include: { food: true },
  });
  return NextResponse.json(log);
}
