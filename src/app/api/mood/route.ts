import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (date) {
    const entry = await prisma.moodEntry.findUnique({ where: { date } });
    return NextResponse.json(entry);
  }
  const entries = await prisma.moodEntry.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await prisma.moodEntry.upsert({
    where: { date: body.date },
    update: { tags: body.tags, notes: body.notes },
    create: { date: body.date, tags: body.tags, notes: body.notes },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  await prisma.moodEntry.deleteMany({ where: { date } });
  return NextResponse.json({ success: true });
}
