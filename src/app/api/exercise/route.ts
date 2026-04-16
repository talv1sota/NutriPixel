import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  const exercises = await prisma.exercise.findMany({
    where: { userId: session.userId, ...(date ? { date } : {}) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(exercises);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const exercise = await prisma.exercise.create({
    data: {
      userId: session.userId,
      name: body.name,
      caloriesBurned: body.caloriesBurned,
      duration: body.duration,
      date: body.date,
    },
  });
  return NextResponse.json(exercise);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const exercise = await prisma.exercise.findFirst({ where: { id: parseInt(id), userId: session.userId } });
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.exercise.delete({ where: { id: exercise.id } });
  return NextResponse.json({ success: true });
}
