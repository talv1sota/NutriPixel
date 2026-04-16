import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const logs = await prisma.foodLog.findMany({
    where: { userId: session.userId, date },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const log = await prisma.foodLog.create({
    data: {
      userId: session.userId,
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Verify ownership before deleting
  const log = await prisma.foodLog.findFirst({ where: { id: parseInt(id), userId: session.userId } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.foodLog.delete({ where: { id: log.id } });
  return NextResponse.json({ success: true });
}
