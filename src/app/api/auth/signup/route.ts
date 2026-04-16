import { prisma } from "@/lib/db";
import { createSession, normalizeEmail } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!email || !password || !name) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json(
      { error: "Password must contain at least one letter and one number" },
      { status: 400 },
    );
  }

  if (name.length > 100) {
    return NextResponse.json({ error: "Name must be 100 characters or fewer" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Claim the placeholder migration user if it exists (preserves pre-auth tracking data)
  const placeholder = await prisma.user.findFirst({
    where: { email: "migrated@nutripixel.local" },
  });

  if (placeholder) {
    const user = await prisma.user.update({
      where: { id: placeholder.id },
      data: { email, passwordHash, name },
    });
    await createSession({ userId: user.id, email: user.email, name: user.name });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  }

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  // Create default goals for new user
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

  await createSession({ userId: user.id, email: user.email, name: user.name });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
