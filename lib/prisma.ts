import { PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// Optimization for Cloudflare Workers: use Fetch instead of WebSockets where possible
const connectionString = process.env.DATABASE_URL!
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1')

if (isLocal) {
    if (typeof WebSocket === 'undefined') {
        try {
            neonConfig.webSocketConstructor = require('ws')
        } catch { /* ws not available */ }
    }
    neonConfig.useSecureWebSocket = false
} else {
    // In production (Cloudflare), standard Fetch is faster and more reliable
    neonConfig.poolQueryViaFetch = true
}

const adapter = new PrismaNeon({ connectionString })

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
