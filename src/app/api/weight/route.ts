import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.weightEntry.findMany({
    where: { userId: session.userId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const entry = await prisma.weightEntry.upsert({
    where: { userId_date: { userId: session.userId, date: body.date } },
    update: { weight: body.weight },
    create: { userId: session.userId, weight: body.weight, date: body.date },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const entry = await prisma.weightEntry.findFirst({ where: { id: parseInt(id), userId: session.userId } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.weightEntry.delete({ where: { id: entry.id } });
  return NextResponse.json({ success: true });
}
