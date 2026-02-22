# Gamers United Cyprus Website

Production-ready Next.js App Router project for Gamers United Cyprus, built with React, TypeScript, TailwindCSS, NextAuth, Stripe, Printify, and Prisma.

## Stack & Architecture

- **Frontend**: Next.js 16 (App Router), React, TypeScript, TailwindCSS v4, Framer Motion
- **Authentication**: Auth.js (NextAuth v5) using Discord OAuth2
- **Database**: PostgreSQL mapped via Prisma ORM
- **Payments & E-Shop**: Stripe Integration (with Webhooks for tracking) & Printify API for fulfillments
- **Hosting**: Deployed to Cloudflare Pages via GitHub Actions

## Directory Structure

- `/app` - Next.js Pages & Route Handlers
- `/components` - Reusable React Components (e.g., UI elements, AuthProvider)
- `/lib` - Application Libraries (e.g., Prisma Singleton)
- `/services` - External APIs wrappers (e.g., Printify Integration)
- `/prisma` - Database schema, migrations
- `/.github` - GitHub CI/CD Actions for Cloudflare Pages deployment

## Local Setup

### 1. Environment Configuration

Clone `.env.example` to `.env.local` and define keys:

```bash
cp .env.example .env.local
```

Here's exactly what's required in your `.env.local`:

```env
# URL Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Secret generation: openssl rand -base64 32
AUTH_SECRET="YOUR_AUTH_SECRET"

# Discord Developer Portal -> OAuth2
DISCORD_CLIENT_ID="YOUR_DISCORD_CLIENT_ID"
DISCORD_CLIENT_SECRET="YOUR_DISCORD_SECRET"

# PostgreSQL Connection String
DATABASE_URL="postgres://user:password@localhost:5432/gamersunited"

# Stripe Keys (Dashboard -> Developers)
STRIPE_SECRET_KEY="sk_test_..."
# Webhook secret (generated when you create the webhook in Stripe)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Printify Settings
PRINTIFY_API_KEY="YOUR_PERSONAL_ACCESS_TOKEN"
PRINTIFY_SHOP_ID="YOUR_SHOP_ID"
```

### 2. Install & Database Initialization

Make sure PostgreSQL is running, then execute:

```bash
npm install
# Push the schema to your database (Make sure you don't overwrite proddb!)
npx prisma db push
# OR, to create a migration:
npx prisma migrate dev --name init
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Webhook Configuration

### Stripe
1. Go to Stripe Dashboard -> Developers -> Webhooks
2. Add an Endpoint pointing to `https://gamersunited.cy/api/webhooks/stripe`
3. Listen ONLY for the `checkout.session.completed` event.
4. Copy the Signing Secret (`whsec_...`) and place it in the application's `STRIPE_WEBHOOK_SECRET`.
5. For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Printify
Printify usually pushes order status out to you. If you set up Printify -> Stripe checkout flows via our internal Printify Service (`/services/printify.ts`), the internal stripe webhook acts as the proxy to actually push an order to Printify using the *REST API* (`createPrintifyOrder`). Printify Webhooks are optional directly but can be configured pointing back if needed to track Printify-side shipping updates.

## Deployment & Cloudflare Pages Setup

1. Store the `.github/workflows/deploy.yml` in your repository.
2. In GitHub -> Settings -> Secrets and variables -> Actions, create **Repository Secrets** for:
   - `DATABASE_URL` 
   - `AUTH_SECRET`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID`
   - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
   - `CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID`
3. When you push to the `main` branch, the Next.js site will compile as edge functions via `@cloudflare/next-on-pages` and then deploy to your CF Pages project.
4. In **Cloudflare Pages Dashboard**, verify that under the project's **Settings -> Environment variables**, your Database URL and other keys matches the Production variants.
5. In CF Pages Settings, map custom domain `gamersunited.cy` to the project.
