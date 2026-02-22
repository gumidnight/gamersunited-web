import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Conditionally require `ws` only if window/WebSocket isn't available natively (e.g. in Node.js dev server vs Edge runtime)
if (typeof WebSocket === 'undefined' && process.env.NODE_ENV !== 'production') {
    neonConfig.webSocketConstructor = require('ws')
}

const connectionString = process.env.DATABASE_URL || "postgres://user:password@localhost:5432/gamersunited"
const adapter = new PrismaNeon({ connectionString })

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: ['query'],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
