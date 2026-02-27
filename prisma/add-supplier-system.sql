-- Migration: Add Multi-Supplier System
-- Generated from Prisma schema diff
-- This is an ADDITIVE migration — no columns or tables are removed

-- 1. Supplier Registry
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_slug_key" ON "Supplier"("slug");

-- 2. Product additions
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierType" TEXT NOT NULL DEFAULT 'printful';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION;

-- 3. Variant additions
ALTER TABLE "Variant" ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION;

-- 4. OrderItem additions
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "supplierType" TEXT NOT NULL DEFAULT 'printful';
-- Add variant FK if not exists
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;

-- 5. Order additions
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- 6. SyncLog additions
ALTER TABLE "SyncLog" ADD COLUMN IF NOT EXISTS "supplierSlug" TEXT;

-- 7. SupplierOrder table
CREATE TABLE IF NOT EXISTS "SupplierOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "rawResponse" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierOrder_externalOrderId_key" ON "SupplierOrder"("externalOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierOrder_orderId_supplierId_key" ON "SupplierOrder"("orderId", "supplierId");

-- 8. InventoryLog table
CREATE TABLE IF NOT EXISTS "InventoryLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- 9. Foreign keys (ignore errors if they already exist)
DO $$ BEGIN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey"
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_supplierId_fkey"
        FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
        FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. Seed default supplier records
INSERT INTO "Supplier" ("id", "name", "slug", "isActive", "createdAt")
VALUES
    ('sup_printful', 'Printful', 'printful', true, CURRENT_TIMESTAMP),
    ('sup_cj', 'CJ Dropshipping', 'cj', true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- 11. Backfill existing products with printful supplier
UPDATE "Product" SET "supplierId" = 'sup_printful', "supplierType" = 'printful'
WHERE "supplierId" IS NULL;
