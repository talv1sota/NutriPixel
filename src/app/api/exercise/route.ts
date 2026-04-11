import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const exercises = await prisma.exercise.findMany({
    where: date ? { date } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const exercise = await prisma.exercise.create({
    data: {
      name: body.name,
      caloriesBurned: body.caloriesBurned,
      duration: body.duration,
      date: body.date,
    },
  });
  return NextResponse.json(exercise);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.exercise.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
