# Printful API Integration — Production-Ready Architecture

> **Stack**: Next.js 16 + Prisma 7 + PostgreSQL (Neon) + Stripe  
> **API Version**: Printful REST API v1 (`https://api.printful.com`)  
> **Auth**: Private Token (Bearer)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Sync Engine](#3-sync-engine)
4. [API Endpoints](#4-api-endpoints)
5. [Webhook Handling](#5-webhook-handling)
6. [Rate Limiting Strategy](#6-rate-limiting-strategy)
7. [Mockup Generation](#7-mockup-generation)
8. [Behavioral Flow](#8-behavioral-flow)
9. [Edge Cases & Conflict Resolution](#9-edge-cases--conflict-resolution)
10. [Code Samples (Node.js + Python)](#10-code-samples)
11. [Testing](#11-testing)
12. [Deployment Checklist](#12-deployment-checklist)

---

## 1. Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Printful API  │────▶│  Sync Engine │────▶│   PostgreSQL    │
│  (120 req/min)  │     │  (Rate-aware  │     │  (Prisma ORM)   │
│                 │◀────│   Backoff)    │     │                 │
└────────┬────────┘     └──────────────┘     └────────┬────────┘
         │                                            │
         │  Webhooks                                  │
         ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│ POST /api/       │                          │  Next.js API     │
│ webhooks/printful│                          │  GET /products   │
│ (product_synced, │                          │  GET /products/:id│
│  product_updated,│                          │  POST /sync       │
│  product_deleted,│                          └─────────────────┘
│  stock_updated)  │
└─────────────────┘

Key Design Decisions:
  ✓ Match by external Printful ID (providerId), NEVER by auto-generated PK
  ✓ Upsert pattern prevents duplicates (idempotent)
  ✓ Soft-delete via isActive flag + hard-delete for removed products
  ✓ Sequential API calls with rate-limit header monitoring
  ✓ SyncLog table for audit trail and debugging
  ✓ Manual edits use `manualOverride` flag to survive re-syncs
```

---

## 2. Database Schema

### Entity Relationship Diagram

```
Product (1) ──── (*) Variant
   │                   │
   │                   │
   └──── (*) ProductImage
                       │
Variant (1) ── (*) VariantImage

SyncLog (audit trail — one per sync run)
```

### Prisma Schema Changes

The enhanced schema adds:
- **`ProductImage`** model — stores all product-level mockup URLs with type metadata
- **`VariantImage`** model — stores variant-specific mockup URLs  
- **`lastSyncedAt`** timestamps on Product and Variant
- **`manualOverride`** flag to protect manually edited products
- **`printfulProductId`** and **`printfulVariantId`** as numeric references to Printful catalog IDs
- Enhanced `SyncLog` with detailed metadata

See `prisma/schema.prisma` for the full updated schema.

---

## 3. Sync Engine

### File: `services/printful.ts`

The sync engine handles:
1. **Authentication** — Bearer token via `PRINTFUL_API_KEY` env var
2. **Pagination** — Iterates all pages of `/store/products`
3. **Rate Limiting** — Monitors `x-ratelimit-remaining` header; pauses at < 10 remaining
4. **Exponential Backoff** — On 429 responses, retries with `retry-after` header
5. **Sequential Fetching** — One product detail fetch at a time with 550ms delay

### File: `lib/shop-actions.ts` — `syncPrintfulProducts()`

The sync function:
1. Fetches all products from Printful
2. Upserts each product and its variants by `providerId`  
3. Extracts all image URLs (preview, front, back, lifestyle)
4. Creates `ProductImage` and `VariantImage` records
5. Marks products not in Printful as `isActive: false`
6. Hard-deletes products missing from Printful for 7+ days (optional)
7. Logs everything to `SyncLog`

### Manual Override Protection

Products with `manualOverride: true` have special treatment:
- **Overwritten during sync**: `price`, `stock`, variant additions/removals, images
- **NOT overwritten**: `title`, `description` (these are your custom marketing copy)
- **Always synced**: `isActive` status (if Printful removes it, it's gone)

---

## 4. API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/products` | List all active products with variants & images | Public |
| `GET` | `/api/products/[id]` | Product detail with full variant data | Public |
| `POST` | `/api/sync` | Trigger manual sync | Admin only |
| `POST` | `/api/webhooks/printful` | Receive Printful webhook events | Printful (no auth) |

---

## 5. Webhook Handling

Printful supports these webhook events for product sync:
- `product_synced` — New product imported from ecommerce integration
- `product_updated` — Product or variant created/updated
- `product_deleted` — Product or variant deleted
- `stock_updated` — Stock level changed

### Setup via API:
```bash
curl -X POST https://api.printful.com/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/webhooks/printful",
    "types": ["product_synced", "product_updated", "product_deleted", "stock_updated"]
  }'
```

### Webhook Handler Behavior:
1. Validates the event type
2. For `product_updated`/`product_synced`: re-fetches the product detail and upserts
3. For `product_deleted`: marks product as `isActive: false`
4. For `stock_updated`: updates variant availability
5. Returns 200 OK immediately (Printful retries on non-2xx)

---

## 6. Rate Limiting Strategy

Printful enforces **120 requests/minute** globally and lower limits for resource-intensive endpoints (e.g., mockup generation: 10 req/60s for established stores).

### Strategy:
1. **Sequential requests** — no parallel product detail fetches
2. **550ms delay** between product detail requests (~109 req/min max)
3. **Header monitoring** — read `x-ratelimit-remaining`, pause at < 10
4. **Exponential backoff** on 429 — respect `retry-after` header
5. **Batch chunking** — for initial imports, process in chunks of 50 products

```
Request Flow:
  [Product List Page 1] → 550ms → [Product 1 Detail] → 550ms → [Product 2 Detail] → ...
  
  If x-ratelimit-remaining < 10:
    Sleep 1500ms extra
    
  If HTTP 429:
    Sleep retry-after seconds (default 10s)
    Retry up to 4 times with doubling backoff
```

---

## 7. Mockup Generation

**Important**: Mockup generation is an asynchronous process in Printful.

### Flow:
1. `POST /mockup-generator/create-task/{product_id}` — submits generation task
2. Receive `task_key` in response
3. Poll `GET /mockup-generator/task?task_key={key}` until `status === "completed"`
4. Download and store the resulting mockup URLs  

**Rate limit**: 10 req/60s for established stores, 2 req/60s for new stores.

### For Sync Products (our case):
Sync products already include preview images in the `files` array of each variant. 
The mockup generator is needed only for **custom designs** where you want additional mockup angles.

For standard store sync, the `preview_url` from variant files provides the main product images.

---

## 8. Behavioral Flow

### Initial Import (First Sync)

```
1. Admin clicks "Sync Products" or hits POST /api/sync
2. Sync engine creates SyncLog(status: "RUNNING")
3. Fetch all sync products paginated (GET /store/products)
4. For each product:
   a. Fetch full detail (GET /store/products/{id})
   b. Upsert Product record by providerId
   c. For each variant:
      - Upsert Variant record by providerId
      - Extract color/size from variant name or options
      - Create/update image records
5. Mark products NOT in Printful response as isActive: false
6. Update SyncLog(status: "SUCCESS", productCount: N)
7. Revalidate /shop paths
```

### Delta Sync (Subsequent Syncs)

Same flow as initial import — the upsert pattern means:
- New products → created
- Existing products → updated
- Missing products → deactivated
- Changed variants → updated in place

### Webhook-Driven Sync

```
1. Printful sends POST to /api/webhooks/printful
2. Handler identifies event type
3. product_updated: 
   - Fetch product detail by ID from webhook payload
   - Upsert product + variants + images
4. product_deleted:
   - Mark product/variant as isActive: false
5. Return 200 OK
```

### Product Removal

```
1. Full sync detects product missing from Printful response
2. Product marked isActive: false (soft delete)
3. Frontend filters by isActive: true — product disappears from shop
4. Optional: cron job hard-deletes products inactive for 7+ days
```

---

## 9. Edge Cases & Conflict Resolution

### Duplicate Prevention
- Every product/variant uses `providerId` (Printful's ID) as a unique constraint
- `upsert` pattern: match on `providerId`, create if missing, update if found
- This is inherently idempotent — running sync twice produces the same result

### ID Changes
- If Printful changes a variant's ID (rare but possible):
  - The old variant becomes orphaned (deactivated by the "not in response" logic)
  - The new ID creates a fresh variant record
  - **Mitigation**: match by external_id when available, fall back to Printful ID

### Manual Override Protection
Products with `manualOverride: true`:
- Keep custom `title` and `description`
- Still receive price, image, and variant updates from Printful
- `isActive` always syncs (safety — if Printful removes it, the site should too)

### Storefront vs API Products
Printful distinguishes between:
- **Products API** (`/store/products`) — for Manual orders / API platform stores
- **Ecommerce Platform Sync API** (`/store/sync/products`) — for ecommerce integrations

We use the **Products API** since this is a custom integration. Products created in the Printful dashboard for your API store will appear here. If you have an ecommerce platform integration, those products appear under the Sync API instead — our code handles both endpoints.

### Stock Management
Printful is print-on-demand — there's no traditional "stock" count. Stock is effectively infinite for most products. The `stock` field in our DB defaults to a high number. The `stock_updated` webhook handles rare cases where Printful marks items as temporarily unavailable.

---

## 10. Code Samples

### Node.js (JavaScript) — see `services/printful.ts` and `lib/shop-actions.ts`
### Python — see `docs/printful_sync_python.py`

---

## 11. Testing

See `__tests__/sync.test.ts` for unit tests covering:
- Product upsert (new + existing)
- Variant attribute parsing (color, size)
- Image extraction and deduplication
- Product deletion/deactivation
- Rate limit handling
- Webhook event processing

---

## 12. Deployment Checklist

- [ ] Set `PRINTFUL_API_KEY` in production environment
- [ ] Set `PRINTFUL_WEBHOOK_URL` to your public domain + `/api/webhooks/printful`
- [ ] Run `npx prisma migrate deploy` to apply schema changes
- [ ] Register webhooks with Printful API (see Section 5)
- [ ] Run initial sync via admin panel or `POST /api/sync`
- [ ] Set up monitoring for SyncLog failures
- [ ] Optional: configure cron job for periodic delta syncs (every 15-30 min)
