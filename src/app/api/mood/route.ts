import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (date) {
    const entry = await prisma.moodEntry.findUnique({
      where: { userId_date: { userId: session.userId, date } },
    });
    return NextResponse.json(entry);
  }
  const entries = await prisma.moodEntry.findMany({
    where: { userId: session.userId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const entry = await prisma.moodEntry.upsert({
    where: { userId_date: { userId: session.userId, date: body.date } },
    update: { tags: body.tags, notes: body.notes },
    create: { userId: session.userId, date: body.date, tags: body.tags, notes: body.notes },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  await prisma.moodEntry.deleteMany({ where: { userId: session.userId, date } });
  return NextResponse.json({ success: true });
}
