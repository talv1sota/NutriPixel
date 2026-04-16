import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ error: "Username must be 3-30 characters" }, { status: 400 });
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Claim placeholder migration user if it exists (preserves pre-auth tracking data)
  const placeholder = await prisma.user.findFirst({
    where: { username: "migrated@nutripixel.local" },
  });

  if (placeholder) {
    const user = await prisma.user.update({
      where: { id: placeholder.id },
      data: { username, passwordHash },
    });
    await createSession({ userId: user.id, username: user.username });
    return NextResponse.json({ id: user.id, username: user.username });
  }

  const user = await prisma.user.create({
    data: { username, passwordHash },
  });

  await prisma.goal.create({
    data: {
      userId: user.id,
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 65,
      unit: "lbs",
    },
  });

  await createSession({ userId: user.id, username: user.username });
  return NextResponse.json({ id: user.id, username: user.username });
}
