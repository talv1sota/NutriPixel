import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const logs = await prisma.foodLog.findMany({
    where: { date },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const log = await prisma.foodLog.create({
    data: {
      foodId: body.foodId,
      amount: body.amount,
      meal: body.meal,
      date: body.date,
    },
    include: { food: true },
  });
  return NextResponse.json(log);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.foodLog.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
