import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const entries = await prisma.weightEntry.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await prisma.weightEntry.upsert({
    where: { date: body.date },
    update: { weight: body.weight },
    create: { weight: body.weight, date: body.date },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.weightEntry.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
