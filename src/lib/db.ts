import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function neonUrl() {
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.delete("channel_binding");
  url.searchParams.delete("sslmode");
  return url.toString();
}

function createPrismaClient() {
  const adapter = new PrismaNeonHTTP(neonUrl(), {});
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
