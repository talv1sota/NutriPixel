import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_GOAL_FIELDS = [
  "goalType", "targetWeight", "targetDate", "targetCalories",
  "targetProtein", "targetCarbs", "targetFat",
  "minCarbs", "minFat", "minProtein",
  "proteinMode", "carbsMode", "fatMode",
  "unit", "height", "heightUnit", "gender", "age", "activityLevel",
] as const;

function pickGoalFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_GOAL_FIELDS) {
    if (key in body) data[key] = body[key];
  }
  return data;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let goal = await prisma.goal.findFirst({ where: { userId: session.userId } });
  if (!goal) {
    goal = await prisma.goal.create({
      data: {
        userId: session.userId,
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 250,
        targetFat: 65,
      },
    });
  }
  return NextResponse.json(goal);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = pickGoalFields(body);

  let goal = await prisma.goal.findFirst({ where: { userId: session.userId } });
  if (goal) {
    goal = await prisma.goal.update({
      where: { id: goal.id },
      data,
    });
  } else {
    goal = await prisma.goal.create({ data: { userId: session.userId, ...data } });
  }
  return NextResponse.json(goal);
}
