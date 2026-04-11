import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  let goal = await prisma.goal.findFirst();
  if (!goal) {
    goal = await prisma.goal.create({
      data: { targetCalories: 2000, targetProtein: 150, targetCarbs: 250, targetFat: 65 },
    });
  }
  return NextResponse.json(goal);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  let goal = await prisma.goal.findFirst();
  if (goal) {
    goal = await prisma.goal.update({
      where: { id: goal.id },
      data: body,
    });
  } else {
    goal = await prisma.goal.create({ data: body });
  }
  return NextResponse.json(goal);
}
