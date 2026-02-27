import { PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Fix for DEPTH_ZERO_SELF_SIGNED_CERT during build/local dev
if (process.env.NODE_ENV !== 'production' || (typeof window === 'undefined' && !process.env.CF_PAGES)) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// In Workers runtime, WebSocket is available globally
// ws is only needed for Node.js dev server
if (typeof WebSocket === 'undefined') {
    try {
        neonConfig.webSocketConstructor = require('ws')
    } catch {
        // ws not available, running in Workers runtime
    }
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
}

const isNeonUrl = connectionString.includes("neon.tech")

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    (() => {
        // Neon serverless adapter only for Neon-hosted Postgres URLs.
        if (isNeonUrl) {
            neonConfig.poolQueryViaFetch = true
            const adapter = new PrismaNeon({ connectionString })
            return new PrismaClient({
                adapter,
                log: process.env.NODE_ENV === 'development' ? ['query'] : [],
            })
        }

        // Local/standard Postgres connections should use native Prisma driver.
        return new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query'] : [],
        })
    })()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
