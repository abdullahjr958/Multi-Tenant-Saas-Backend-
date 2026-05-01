import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env["DATABASE"],
})

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
}

export const prisma = 
    globalForPrisma.prisma ?? 
    new PrismaClient({
        log: ["query", "error", "warn"],
        adapter
    });

if(process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = prisma;