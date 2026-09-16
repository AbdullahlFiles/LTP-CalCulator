import { PrismaClient } from "@prisma/client";

/**
 * A single shared PrismaClient for the process, following the standard
 * Next.js dev-mode guidance (avoids exhausting Postgres connections across
 * hot-reloads). apps/web and apps/realtime-gateway (once it exists) both
 * import this rather than constructing their own client.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
