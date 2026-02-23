# OpenNext Cloudflare Migration Plan — Free Tier Optimized

**Project:** Gamers United  
**Date:** 2026-02-22  
**Current Stack:** Next.js 16.1.6 + `@cloudflare/next-on-pages` + Edge Runtime  
**Target Stack:** Next.js 16.1.6 + `@opennextjs/cloudflare` + Node.js Runtime  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Audit](#2-current-architecture-audit)
3. [Bundle Size Risk Analysis](#3-bundle-size-risk-analysis)
4. [Route Analysis: SSR vs Static](#4-route-analysis-ssr-vs-static)
5. [Prisma Strategy](#5-prisma-strategy)
6. [Stripe + Webhooks Strategy](#6-stripe--webhooks-strategy)
7. [Discord OAuth Strategy](#7-discord-oauth-strategy)
8. [Migration Steps (Required Code Changes)](#8-migration-steps-required-code-changes)
9. [Deployment Structure](#9-deployment-structure)
10. [CI/CD Update](#10-cicd-update)
11. [Aggressive Optimization Checklist](#11-aggressive-optimization-checklist)
12. [Scaling Risks on Free Tier](#12-scaling-risks-on-free-tier)

---

## 1. Executive Summary

### The Problem

Your current `@cloudflare/next-on-pages` setup requires `export const runtime = "edge"` on every server-rendered route (12 routes). Each Edge function bundles its own copy of:

- Prisma WASM query engine: **~1.8 MiB per function**
- Stripe SDK: **~0.5 MiB per function**
- next-auth internals: **~0.3 MiB per function**

**12 functions × ~2.6 MiB = ~31 MiB total** → exceeds Cloudflare Pages Functions limits.

### The Solution

**Migrate to `@opennextjs/cloudflare`**, which:

1. **Produces a single Worker** (not 12 separate Edge functions)
2. **Uses Node.js runtime** (not Edge) — all dependencies bundled once
3. **Eliminates WASM duplication** — Prisma with Neon adapter works natively
4. **Free tier limit is 3 MiB _compressed_ (gzip)** — achievable with optimization

### Key Insight from Official Docs

> "The size limit of a Cloudflare Worker is 3 MiB on the Workers Free plan. Only the **compressed (gzip) size** matters for the Worker size limit."
>
> Example from docs: `Total Upload: 13833.20 KiB / gzip: 2295.89 KiB` — this would fit on free tier.

This means your **uncompressed** bundle can be ~10-14 MiB as long as it **gzip-compresses to under 3 MiB**.

---

## 2. Current Architecture Audit

### Project Structure

```
app/
├── page.tsx                      # Home — STATIC (no prisma, no runtime export)
├── about/page.tsx                # About — CLIENT-ONLY ("use client")
├── community/page.tsx            # Community — CLIENT-ONLY ("use client")
├── contact/page.tsx              # Contact — CLIENT-ONLY ("use client")
├── faq/page.tsx                  # FAQ — CLIENT-ONLY ("use client")
├── privacy/page.tsx              # Privacy — CLIENT-ONLY ("use client")
├── terms/page.tsx                # Terms — CLIENT-ONLY ("use client")
├── tournaments/page.tsx          # Tournaments — CLIENT-ONLY ("use client")
├── news/page.tsx                 # News List — SSR (prisma + edge)
├── news/[slug]/page.tsx          # News Detail — SSR (prisma + edge)
├── shop/page.tsx                 # Shop List — SSR (prisma + edge)
├── shop/[id]/page.tsx            # Product Detail — SSR (prisma + edge)
├── shop/success/page.tsx         # Success — STATIC (no server deps)
├── settings/page.tsx             # User Settings — SSR (prisma + auth + edge)
├── admin/layout.tsx              # Admin Layout — SSR (auth check)
├── admin/news/page.tsx           # Admin News — SSR (prisma + edge)
├── admin/news/new/page.tsx       # Admin New Post — SSR (edge)
├── admin/news/[id]/page.tsx      # Admin Edit Post — SSR (prisma + edge)
├── admin/shop/page.tsx           # Admin Shop — SSR (prisma + edge)
├── admin/users/page.tsx          # Admin Users — SSR (prisma + edge)
├── api/auth/[...nextauth]/route.ts  # Auth API — edge
└── api/webhooks/stripe/route.ts     # Stripe Webhook — edge
```

### Dependencies (Bundle Weight Analysis)

| Dependency | Installed Version | Estimated Server Bundle Impact | Notes |
|---|---|---|---|
| `@prisma/client` + WASM engine | 7.4.1 | **~1.8 MiB** (WASM) | Was duplicated per Edge function |
| `@prisma/adapter-neon` | 7.4.1 | ~50 KiB | Neon serverless adapter |
| `@neondatabase/serverless` | 0.9.0 | ~80 KiB | WebSocket-based Postgres driver |
| `stripe` | 20.3.1 | **~500 KiB** | Payment SDK |
| `next-auth` | 5.0.0-beta.30 | **~300 KiB** | Auth framework |
| `@auth/prisma-adapter` | 2.11.1 | ~20 KiB | DB adapter for next-auth |
| `framer-motion` | 12.34.3 | ~0 KiB server-side | Client-only, tree-shaken from server |
| `lucide-react` | 0.575.0 | ~0 KiB server-side | Client-only icons |
| `zod` | 4.3.6 | ~50 KiB | Validation |
| `react-google-recaptcha` | 3.1.0 | ~0 KiB server-side | Client-only |
| `ws` | 8.18.0 | ~30 KiB | WebSocket for Neon (dev only) |

### Current Deployment Pipeline

- Build: `npx @cloudflare/next-on-pages@1` → generates per-route Edge functions
- Output: `.vercel/output/static` → deployed to Cloudflare Pages
- CI: GitHub Actions with `cloudflare/pages-action@1`

---

## 3. Bundle Size Risk Analysis

### With OpenNext (Single Worker)

Under OpenNext, **all server code is bundled into one Worker**. No duplication.

| Component | Estimated Size (uncompressed) | Gzip Estimate |
|---|---|---|
| Next.js server runtime | ~3.0 MiB | ~700 KiB |
| Prisma client + Neon adapter | ~1.8 MiB (WASM) + ~130 KiB | ~600 KiB |
| Stripe SDK | ~500 KiB | ~120 KiB |
| next-auth | ~300 KiB | ~80 KiB |
| Application code (all routes) | ~200 KiB | ~50 KiB |
| Other deps (zod, clsx, etc.) | ~100 KiB | ~30 KiB |
| **Total Estimate** | **~6.0 MiB uncompressed** | **~1.6 MiB gzipped** |

### Verdict: ✅ FITS ON FREE TIER

The **3 MiB gzipped limit** is achievable. The Prisma WASM blob compresses very well (~60-70% compression ratio).

### Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Prisma WASM doesn't compress enough | Low | High | Switch to Prisma Accelerate (eliminates WASM entirely) |
| Next.js server runtime too large | Low | Medium | Use `serverExternalPackages` to externalize properly |
| Stripe SDK too heavy | Low | Low | Already slim, `fetchHttpClient` mode is correct |
| Bundle exceeds 3 MiB gzip post-migration | Low | High | See Section 11 for fallback architecture |

---

## 4. Route Analysis: SSR vs Static

### Routes That Truly Need SSR (Dynamic Server Rendering)

These routes query the database or require real-time auth checks at request time:

| Route | Reason for SSR | Can Be Optimized? |
|---|---|---|
| `news/page.tsx` | Prisma query for news list | ✅ Use ISR (revalidate: 300) |
| `news/[slug]/page.tsx` | Prisma query for individual post | ✅ Use ISR (revalidate: 60) |
| `shop/page.tsx` | Prisma query for product list | ✅ Use ISR (revalidate: 3600) |
| `shop/[id]/page.tsx` | Prisma query for product detail | ✅ Use ISR (revalidate: 3600) |
| `settings/page.tsx` | Auth + Prisma user query | ❌ Must stay SSR (user-specific) |
| `admin/layout.tsx` | Auth check | ❌ Must stay SSR |
| `admin/news/page.tsx` | Prisma query for admin | ❌ Must stay SSR |
| `admin/news/[id]/page.tsx` | Prisma query for editing | ❌ Must stay SSR |
| `admin/news/new/page.tsx` | Auth-gated | ❌ Must stay SSR |
| `admin/shop/page.tsx` | Prisma query for admin | ❌ Must stay SSR |
| `admin/users/page.tsx` | Prisma query for admin | ❌ Must stay SSR |
| `api/auth/[...nextauth]/route.ts` | Auth endpoints | ❌ Must stay dynamic |
| `api/webhooks/stripe/route.ts` | Webhook handler | ❌ Must stay dynamic |

### Routes That Are Already Static / Can Be Static

| Route | Current State | Action Required |
|---|---|---|
| `page.tsx` (Home) | Server component, no DB | ✅ Already static (no changes needed) |
| `about/page.tsx` | `"use client"` | ✅ Already client-only (static HTML + JS) |
| `community/page.tsx` | `"use client"` | ✅ Already client-only |
| `contact/page.tsx` | `"use client"` | ✅ Already client-only |
| `faq/page.tsx` | `"use client"` | ✅ Already client-only |
| `privacy/page.tsx` | `"use client"` | ✅ Already client-only |
| `terms/page.tsx` | `"use client"` | ✅ Already client-only |
| `tournaments/page.tsx` | `"use client"` | ✅ Already client-only |
| `shop/success/page.tsx` | Server component, no DB | ✅ Already static |

### ISR Optimization Recommendations

For public-facing pages that query the database, switch from `force-dynamic` to ISR:

```tsx
// news/page.tsx — instead of force-dynamic
export const revalidate = 300; // Revalidate every 5 minutes

// shop/page.tsx — instead of force-dynamic
export const revalidate = 3600; // Revalidate every hour (products rarely change)
```

This reduces Worker invocations (good for the free tier 100K/day request limit) and improves TTFB.

**Note:** ISR requires R2 bucket for cache storage under OpenNext. This is free within R2's free tier (10 GB storage, 1M operations/month).

### API Routes That Can Be Consolidated

Currently only 2 API routes exist:
- `api/auth/[...nextauth]` — **Keep as-is** (required by next-auth)
- `api/webhooks/stripe` — **Keep as-is** (required by Stripe)

There's nothing to consolidate. The server actions (`lib/*-actions.ts`) are not API routes — they're Next.js Server Actions which are bundled into the Worker code automatically.

---

## 5. Prisma Strategy

### Current Setup

- **Prisma 7.4.1** with `@prisma/adapter-neon` + `@neondatabase/serverless`
- **WASM query engine** (default for Prisma 7.x)
- No query engine specified in schema (defaults to library/WASM based on environment)
- JWT-based auth sessions (no DB session queries for auth on each request)

### Evaluation of Options

#### Option A — Standard Prisma Client with Neon Adapter (RECOMMENDED ✅)

**What you already have**, just dropping the Edge duplication.

- **Bundle impact:** ~1.8 MiB uncompressed WASM + ~130 KiB JS → **~600 KiB gzipped**
- **Works with OpenNext:** Yes — OpenNext bundles Prisma once into the single Worker
- **Connection:** WebSocket-based via Neon serverless driver (no TCP required)
- **Tradeoff:** Largest single dependency, but only bundled **once** now

**Recommendation:** Keep this. It works today, it compresses well, and the Neon adapter is designed for serverless.

**Required `next.config.ts` change:**
```ts
serverExternalPackages: ["@prisma/client", ".prisma/client"]
```
This tells Next.js to treat Prisma as external, allowing OpenNext to patch and properly include it in the Workerd runtime.

#### Option B — Prisma Accelerate

- **Bundle impact:** ~200 KiB (no WASM — uses HTTP API to Prisma Data Proxy)
- **Connection:** HTTPS to Prisma's hosted proxy
- **Tradeoff:** Adds external dependency on Prisma Cloud service. Free tier has limits (100K queries on Starter plan). Adds network latency per query.
- **Cost:** Free for 100K queries/month, then $0.18/1000 queries

**Verdict:** Good fallback if bundle size is still too large. Not needed unless Option A fails.

#### Option C — Replace Prisma with Drizzle ORM

- **Bundle impact:** ~150 KiB (no WASM at all)
- **Connection:** Direct via `@neondatabase/serverless` (same driver you have)
- **Tradeoff:** **Full rewrite of all database code.** Schema migration, query rewrite, auth adapter replacement (`@auth/drizzle-adapter`). High effort, high risk.
- **Effort:** 2-3 days of rewriting + testing

**Verdict:** Best long-term bundle size, but too much migration risk for an already-working app. Consider only if Option A and B both fail.

#### Option D — Move DB Calls to Single API Entrypoint

- **Bundle impact:** Would isolate Prisma to one route handler
- **Tradeoff:** Destroys Next.js server component patterns. All pages would need client-side fetching. Worse UX, worse SEO. Defeats the purpose of App Router.

**Verdict:** ❌ Reject. Anti-pattern for Next.js App Router.

### Final Prisma Recommendation

**Option A — Keep Prisma + Neon adapter.** Remove Edge runtime exports. Add `serverExternalPackages`. OpenNext will bundle it once.

**Is Prisma Accelerate still required?** **No.** You're not using it now, and you don't need it. The Neon serverless adapter provides its own WebSocket-based connection that works in Workers. Accelerate is only needed if you want to eliminate the WASM engine entirely for bundle size reasons.

**Will WASM still be bundled per function?** **No.** OpenNext produces a single Worker. WASM is included once.

---

## 6. Stripe + Webhooks Strategy

### Current Setup

```typescript
// app/api/webhooks/stripe/route.ts
export const dynamic = "force-dynamic";
export const runtime = "edge";
// Uses: Stripe SDK, prisma, createPrintfulOrder
```

### Required Changes

1. **Remove `export const runtime = "edge"`** — OpenNext doesn't support Edge runtime
2. **Keep `export const dynamic = "force-dynamic"`** — webhooks must always execute
3. **Raw body handling works natively** — current code uses `req.text()` for raw body, which works perfectly in the Workers runtime
4. **Signature verification works** — `stripe.webhooks.constructEventAsync()` using fetch client is correct

### Optimized Webhook Route

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createPrintfulOrder } from "@/services/printful";

export const dynamic = "force-dynamic";
// NO runtime export — defaults to Node.js runtime under OpenNext

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2023-10-16" as any,
        httpClient: Stripe.createFetchHttpClient(),
    });
    // ... rest unchanged
}
```

### Stripe SDK Bundle Impact

- **~500 KiB uncompressed → ~120 KiB gzipped**
- Only bundled once in the single Worker
- `Stripe.createFetchHttpClient()` is already correct for Workers (no node `http` module)

### No Duplicate Bundling

Under `@cloudflare/next-on-pages`, Stripe was bundled into the webhook Edge function AND into server actions that import `lib/stripe.ts`. Under OpenNext, it's bundled **once**.

---

## 7. Discord OAuth Strategy

### Current Setup

```typescript
// auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),  // DB adapter for persisting accounts
    providers: [DiscordProvider(...)],
    session: { strategy: "jwt" }      // ✅ Already JWT-based!
});
```

### Assessment

✅ **Already optimized.** Key observations:

1. **JWT sessions** — `session: { strategy: "jwt" }` means auth doesn't hit the DB on every request. The JWT token contains `id` and `role`. This is the lightest option.

2. **PrismaAdapter** — Still needed for persisting user accounts, linking Discord accounts, etc. But it's only used during sign-in/sign-up, not on every request.

3. **No unnecessary dependencies** — You're using `next-auth` which is the standard. No additional OAuth libraries.

### Required Changes

1. **Remove `export const runtime = "edge"` from `api/auth/[...nextauth]/route.ts`**
2. No other changes needed

### Session Storage Comparison

| Strategy | DB Queries Per Request | Bundle Size Impact | Session Data Location |
|---|---|---|---|
| **JWT (current) ✅** | 0 (reads from cookie) | Smallest | Cookie (encrypted) |
| DB Session | 1 per request | Same | Database row |
| KV Session | 1 KV read/write | Needs KV binding | Cloudflare KV |

**Your current JWT strategy is already the most efficient.** No change needed.

---

## 8. Migration Steps (Required Code Changes)

### Step 1: Install OpenNext + Update Wrangler

```bash
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
npm uninstall @cloudflare/next-on-pages
```

### Step 2: Remove ALL `export const runtime = "edge"` Exports

Files to modify (12 files):

```
app/news/page.tsx                    — remove line 1
app/news/[slug]/page.tsx             — remove line 1
app/admin/news/page.tsx              — remove line 1
app/admin/news/new/page.tsx          — remove line 1
app/admin/news/[id]/page.tsx         — remove line 1
app/shop/page.tsx                    — remove line 1
app/shop/[id]/page.tsx               — remove line 1
app/admin/shop/page.tsx              — remove line 1
app/admin/users/page.tsx             — remove line 1
app/settings/page.tsx                — remove line 1
app/api/auth/[...nextauth]/route.ts  — remove line 3
app/api/webhooks/stripe/route.ts     — remove line 8
```

### Step 3: Update `next.config.ts`

```typescript
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com', pathname: '/**' },
      { protocol: 'https', hostname: 'files.cdn.printful.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'upload.wikimedia.org', pathname: '/**' },
      { protocol: 'https', hostname: 'logos-world.net', pathname: '/**' },
      { protocol: 'https', hostname: 'seeklogo.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.fna.fbcdn.net', pathname: '/**' },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Critical for OpenNext + Prisma: externalize Prisma packages
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;

// Initialize OpenNext dev bindings for local development
initOpenNextCloudflareForDev();
```

### Step 4: Create `open-next.config.ts`

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // R2 incremental cache is optional but recommended for ISR
  // Uncomment when R2 bucket is created:
  // incrementalCache: r2IncrementalCache,
});
```

### Step 5: Update `wrangler.jsonc` (Replace `wrangler.toml`)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "gamersunited-web",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "gamersunited-web"
    }
  ],
  "vars": {
    "NEXT_PUBLIC_SITE_URL": "https://gamersunited.cy"
  }
  // Secrets configured in Cloudflare Dashboard:
  // DATABASE_URL, AUTH_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET,
  // STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PRINTIFY_API_KEY, PRINTIFY_SHOP_ID
}
```

### Step 6: Update `lib/prisma.ts` (Minor Cleanup)

```typescript
import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

// In Workers runtime, WebSocket is available globally
// ws is only needed for Node.js dev server
if (typeof WebSocket === 'undefined') {
    try {
        neonConfig.webSocketConstructor = require('ws')
    } catch {
        // ws not available, running in Workers runtime
    }
}

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 7: Update `lib/stripe.ts` (Minor Cleanup)

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
    appInfo: {
        name: 'Gamers United',
        version: '0.1.0',
    },
    httpClient: Stripe.createFetchHttpClient(),
});
```

### Step 8: Create `.dev.vars`

```
NEXTJS_ENV=development
```

### Step 9: Create `public/_headers`

```
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

### Step 10: Update `.gitignore`

Add:
```
.open-next
```

### Step 11: Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

### Step 12 (Optional): Add ISR to Public Data Pages

```typescript
// app/news/page.tsx
// Replace: export const dynamic = "force-dynamic";
// With:
export const revalidate = 300; // 5 minutes

// app/shop/page.tsx
// Replace: export const dynamic = "force-dynamic";
// With:
export const revalidate = 3600; // 1 hour
```

---

## 9. Deployment Structure

### File Layout After Migration

```
gamersunited/
├── .dev.vars                     # NEW — local dev env vars
├── .gitignore                    # UPDATED — add .open-next
├── open-next.config.ts           # NEW — OpenNext config
├── wrangler.jsonc                # NEW (replaces wrangler.toml)
├── next.config.ts                # UPDATED — serverExternalPackages + initOpenNextCloudflareForDev
├── package.json                  # UPDATED — new scripts, deps
├── public/_headers               # NEW — static asset caching
├── .open-next/                   # BUILD OUTPUT (gitignored)
│   ├── worker.js                 # Single Worker bundle
│   └── assets/                   # Static assets
└── ... (rest unchanged)
```

### Environment Variable Strategy

| Variable | Where Set | Method |
|---|---|---|
| `DATABASE_URL` | Cloudflare Dashboard | Secret |
| `AUTH_SECRET` | Cloudflare Dashboard | Secret |
| `DISCORD_CLIENT_ID` | Cloudflare Dashboard | Secret |
| `DISCORD_CLIENT_SECRET` | Cloudflare Dashboard | Secret |
| `STRIPE_SECRET_KEY` | Cloudflare Dashboard | Secret |
| `STRIPE_WEBHOOK_SECRET` | Cloudflare Dashboard | Secret |
| `PRINTIFY_API_KEY` | Cloudflare Dashboard | Secret |
| `PRINTIFY_SHOP_ID` | Cloudflare Dashboard | Secret |
| `NEXT_PUBLIC_SITE_URL` | `wrangler.jsonc` `vars` | Plain text |
| `NEXTJS_ENV` | `.dev.vars` (local only) | Dev only |

**Important:** Under OpenNext, environment variables are accessed via `process.env` normally. The `nodejs_compat` flag + compatibility date `2024-09-23+` enables `process.env` access in Workers.

Secrets should **NOT** be in `wrangler.jsonc` or in GitHub Actions env vars during build. They should be set via:
```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put AUTH_SECRET
# etc.
```

Or via Cloudflare Dashboard → Workers & Pages → gamersunited-web → Settings → Variables and Secrets.

---

## 10. CI/CD Update

### Updated `.github/workflows/deploy.yml`

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  lint_and_typecheck:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Prisma Generate
        run: npx prisma generate

      - name: Lint Code
        run: npm run lint

      - name: Typecheck
        run: npx tsc --noEmit

  deploy:
    needs: lint_and_typecheck
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Prisma Generate
        run: npx prisma generate

      - name: Build and Deploy with OpenNext
        run: npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          # Build-time env vars (only NEXT_PUBLIC_* are actually used at build time)
          NEXT_PUBLIC_SITE_URL: https://gamersunited.cy
```

### Key Changes from Current CI/CD

1. **No more `npx @cloudflare/next-on-pages@1`** → replaced with `npx opennextjs-cloudflare build`
2. **No more `cloudflare/pages-action@1`** → replaced with `npx opennextjs-cloudflare deploy`
3. **Removed server-side secrets from build step** — they're not needed at build time. `DATABASE_URL`, `STRIPE_SECRET_KEY`, etc. are runtime secrets set in Cloudflare Dashboard.
4. **Separated lint/typecheck from deploy** — faster feedback on PRs
5. **Deployment target is now Workers** (not Pages Functions)

### GitHub Secrets Required

| Secret | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Deploy to Workers |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID |

All other secrets (DATABASE_URL, etc.) should be configured as **Worker secrets** in Cloudflare Dashboard, NOT as GitHub secrets for the deploy step.

---

## 11. Aggressive Optimization Checklist

### If Bundle Still Exceeds 3 MiB gzipped After Migration

Execute these optimizations in order of effort:

#### Level 1: Quick Wins (< 30 minutes)

- [ ] **Verify `serverExternalPackages`** includes Prisma
- [ ] **Remove `ws` from production bundle** — only needed for dev. It shouldn't be bundled in Workers, but verify.
- [ ] **Check if `react-google-recaptcha` is tree-shaken** — it's client-only, should not appear in Worker
- [ ] **Remove unused Prisma models** if any exist — reduces generated client code

#### Level 2: Moderate Effort (1-2 hours)

- [ ] **Switch to Prisma Accelerate** — eliminates WASM entirely, saves ~1.5 MiB compressed
  ```
  npm install @prisma/extension-accelerate
  ```
  Update `generator client` in schema:
  ```prisma
  generator client {
    provider = "prisma-client-js"
    previewFeatures = ["accelerate"]
  }
  ```
  Remove `@prisma/adapter-neon`, `@neondatabase/serverless`, `ws`.

- [ ] **Replace `stripe` with raw `fetch` calls** — if only using Checkout Sessions + Webhooks, you can replace the 500 KiB SDK with ~5 KiB of typed fetch wrappers. (Risky — loses type safety and webhook verification helpers.)

#### Level 3: Structural Changes (if above isn't enough)

- [ ] **Separate Backend Worker Architecture:**
  - Move Prisma + Stripe + Printful logic into a separate Worker (`gamersunited-api`)
  - Frontend Worker (`gamersunited-web`) calls API Worker via Service Bindings
  - Frontend Worker stays tiny (just Next.js rendering)
  - API Worker can be up to 3 MiB on its own

  ```
  ┌─────────────────────┐     Service Binding     ┌──────────────────────┐
  │ gamersunited-web    │ ──────────────────────── │ gamersunited-api     │
  │ (Next.js + OpenNext)│                          │ (Prisma + Stripe)    │
  │ < 3 MiB gzipped     │                          │ < 3 MiB gzipped      │
  └─────────────────────┘                          └──────────────────────┘
  ```

  **Pros:** Each Worker under 3 MiB. Service Bindings are free and zero-latency (same data center).
  **Cons:** More complex deployment. Two Workers to manage. Next.js server components can't directly call Prisma.

- [ ] **Hybrid Architecture:**
  - Keep static pages + client-rendered pages on Cloudflare Workers (via OpenNext)
  - Move admin panel and API routes to a separate Cloudflare Worker or even a cheap VPS
  - Admin panel accessed via subdomain (`admin.gamersunited.cy`)

---

## 12. Scaling Risks on Free Tier

### Cloudflare Workers Free Tier Limits

| Resource | Free Tier Limit | Your Estimated Usage | Risk |
|---|---|---|---|
| Worker size (gzipped) | **3 MiB** | ~1.6 MiB | ✅ Low risk |
| Requests/day | **100,000** | < 5,000 (small community site) | ✅ Very low risk |
| CPU time/invocation | **10 ms** | ~5 ms for most pages | ⚠️ Moderate for Prisma queries |
| Memory | **128 MiB** | ~50 MiB typical | ✅ Low risk |
| R2 storage | **10 GiB** | < 100 MiB (ISR cache) | ✅ Very low risk |
| R2 operations | **1M/month** | < 50K/month | ✅ Very low risk |
| D1 reads | N/A | Not using D1 | N/A |
| KV operations | N/A | Not using KV | N/A |

### Critical Risks

1. **CPU Time (10ms limit on free):** Prisma queries going to Neon may consume significant CPU time during connection establishment. The Neon WebSocket handshake + query execution needs to fit in 10ms of CPU time (not wall clock time). For most simple queries this is fine, but complex joins or batch operations could timeout.

   **Mitigation:** Keep queries simple. Use `select` to limit returned fields. Avoid N+1 queries. Consider Prisma Accelerate if CPU limits become an issue (it shifts computation to Prisma's servers).

2. **100K requests/day:** A viral news post or DDoS could exhaust this. Static assets served from Workers Assets don't count against this limit (they're served from Cloudflare's CDN).

   **Mitigation:** ISR reduces dynamic requests. Consider Cloudflare's free Cache Rules for additional caching.

3. **Cold Starts:** Workers have sub-millisecond cold starts, but Prisma client initialization adds latency on first request. Use connection pooling (Neon serverless handles this automatically).

### When to Upgrade from Free Tier

Consider upgrading to Workers Paid ($5/month) if:
- You regularly exceed 50K requests/day
- CPU time limits cause request failures
- Bundle size exceeds 3 MiB gzipped (paid limit is 10 MiB)
- You need Durable Objects, larger KV storage, or Cron Triggers

---

## Summary of Changes

### Files to Remove
- `wrangler.toml` (replaced by `wrangler.jsonc`)

### Files to Create
- `open-next.config.ts`
- `wrangler.jsonc`
- `.dev.vars`
- `public/_headers`

### Files to Modify
- `next.config.ts` — add `serverExternalPackages`, `initOpenNextCloudflareForDev`
- `package.json` — update deps + scripts
- `lib/prisma.ts` — minor cleanup for Workers runtime
- `lib/stripe.ts` — remove warning log
- `.gitignore` — add `.open-next`
- `.github/workflows/deploy.yml` — switch to OpenNext CLI
- 12 files with `export const runtime = "edge"` — remove that export
- `app/api/webhooks/stripe/route.ts` — remove runtime export

### Dependencies to Add
- `@opennextjs/cloudflare`

### Dependencies to Remove
- `@cloudflare/next-on-pages`

### Dependencies to Update
- `wrangler` → latest (must be ≥ 3.99.0)
