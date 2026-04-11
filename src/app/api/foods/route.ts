import { prisma } from "@/lib/db";
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
