import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET -> { active: FastingSession | null, history: FastingSession[] }
// active = the in-progress fast (endTime null); history = completed ones.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [active, history] = await Promise.all([
    prisma.fastingSession.findFirst({
      where: { userId: session.userId, endTime: null },
      orderBy: { startTime: "desc" },
    }),
    prisma.fastingSession.findMany({
      where: { userId: session.userId, endTime: { not: null } },
      orderBy: { startTime: "desc" },
      take: 60,
    }),
  ]);

  return NextResponse.json({ active, history });
}

// POST { goalHours, startTime? } -> start a fast. Rejects if one is already
// active. startTime may be backdated (e.g. to the user's last meal).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.fastingSession.findFirst({
    where: { userId: session.userId, endTime: null },
  });
  if (existing) {
    return NextResponse.json({ error: "A fast is already in progress" }, { status: 409 });
  }

  const body = await req.json();
  const goalHours = Number(body.goalHours);
  if (!goalHours || goalHours <= 0 || goalHours > 336) {
    return NextResponse.json({ error: "Invalid goalHours" }, { status: 400 });
  }

  // Accept a backdated start, but never a future one, and clamp absurd values.
  let startTime = new Date();
  if (body.startTime) {
    const parsed = new Date(body.startTime);
    if (!isNaN(parsed.getTime()) && parsed.getTime() <= Date.now()) startTime = parsed;
  }

  const created = await prisma.fastingSession.create({
    data: { userId: session.userId, goalHours, startTime },
  });
  return NextResponse.json(created);
}

// PATCH { id?, goalHours? } -> end the active fast (sets endTime = now), or
// adjust its goal. If no id given, operates on the current active fast.
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const target = body.id
    ? await prisma.fastingSession.findFirst({ where: { id: Number(body.id), userId: session.userId } })
    : await prisma.fastingSession.findFirst({ where: { userId: session.userId, endTime: null } });

  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { endTime?: Date; goalHours?: number } = {};
  if (body.end) data.endTime = new Date();
  if (body.goalHours !== undefined) {
    const g = Number(body.goalHours);
    if (g > 0 && g <= 336) data.goalHours = g;
  }

  const updated = await prisma.fastingSession.update({ where: { id: target.id }, data });
  return NextResponse.json(updated);
}

// DELETE ?id= -> remove a session (cancel an active fast, or delete history).
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const entry = await prisma.fastingSession.findFirst({ where: { id: parseInt(id), userId: session.userId } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.fastingSession.delete({ where: { id: entry.id } });
  return NextResponse.json({ success: true });
}
