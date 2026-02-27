"""
Printful API Integration — Python Reference Implementation
===========================================================

Production-ready Python implementation for syncing Printful products
into a custom eCommerce database.

Dependencies:
    pip install requests psycopg2-binary python-dotenv

Usage:
    from printful_sync_python import PrintfulClient, ProductSyncer

    client = PrintfulClient(api_key="your_token")
    syncer = ProductSyncer(client, db_url="postgresql://user:pass@host/db")
    syncer.full_sync()
"""

import os
import time
import logging
from typing import Any, Optional
from datetime import datetime, timezone

import requests

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    psycopg2 = None  # type: ignore

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("printful")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("[%(name)s] %(levelname)s: %(message)s"))
logger.addHandler(handler)


# ──────────────────────────────────────────────────────────────────────────────
# Printful API Client
# ──────────────────────────────────────────────────────────────────────────────


class PrintfulClient:
    """
    Rate-limit-aware HTTP client for the Printful API.

    Features:
        - Bearer token authentication
        - Automatic rate limit monitoring (120 req/min)
        - Exponential backoff on 429 responses
        - Configurable retry count
    """

    BASE_URL = "https://api.printful.com"

    def __init__(self, api_key: Optional[str] = None, max_retries: int = 4):
        self.api_key = api_key or os.environ.get("PRINTFUL_API_KEY")
        if not self.api_key:
            raise ValueError("PRINTFUL_API_KEY is required")

        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "X-PF-Language": "en",
            }
        )

    def _request(
        self, method: str, endpoint: str, retries: int = -1, **kwargs: Any
    ) -> Any:
        """Make an API request with rate limit handling and backoff."""
        if retries < 0:
            retries = self.max_retries

        url = f"{self.BASE_URL}{endpoint}"
        response = self.session.request(method, url, **kwargs)

        # Monitor rate limit headers
        remaining = int(response.headers.get("x-ratelimit-remaining", 60))
        if remaining < 10:
            logger.warning(f"Rate limit approaching ({remaining} remaining), pausing 1.5s…")
            time.sleep(1.5)

        # Handle 429 Too Many Requests
        if response.status_code == 429:
            if retries <= 0:
                raise Exception("Printful rate limit exceeded after all retries")
            retry_after = int(response.headers.get("retry-after", 10))
            backoff = retry_after * (1.5 ** (self.max_retries - retries))
            logger.warning(f"Rate limited. Retrying in {backoff:.1f}s ({retries} left)")
            time.sleep(backoff)
            return self._request(method, endpoint, retries - 1, **kwargs)

        response.raise_for_status()
        data = response.json()
        return data.get("result")

    def get(self, endpoint: str, **kwargs: Any) -> Any:
        return self._request("GET", endpoint, **kwargs)

    def post(self, endpoint: str, json_data: dict, **kwargs: Any) -> Any:
        return self._request("POST", endpoint, json=json_data, **kwargs)

    def delete(self, endpoint: str, **kwargs: Any) -> Any:
        return self._request("DELETE", endpoint, **kwargs)

    # ─── Product APIs ────────────────────────────────────────────────────

    def get_sync_products(self, limit: int = 100) -> list[dict]:
        """Fetch all sync products with pagination."""
        all_products = []
        offset = 0

        while True:
            page = self.get(f"/store/products?offset={offset}&limit={limit}")
            if not page or len(page) == 0:
                break
            all_products.extend(page)
            if len(page) < limit:
                break
            offset += limit

        return all_products

    def get_sync_product(self, product_id: int) -> dict:
        """Fetch full detail for a single sync product."""
        return self.get(f"/store/products/{product_id}")

    def get_all_product_details(self) -> list[dict]:
        """
        Fetch all sync products with their full details.
        Sequential to respect rate limits.
        """
        products = self.get_sync_products()
        logger.info(f"Found {len(products)} sync products. Fetching details…")

        details = []
        for i, p in enumerate(products, 1):
            try:
                detail = self.get_sync_product(p["id"])
                details.append(detail)
                logger.info(f"  {i}/{len(products)}: {p['name']}")
            except Exception as e:
                logger.error(f"  Failed to fetch product {p['id']}: {e}")
            time.sleep(0.55)  # ~109 req/min max

        return details

    # ─── Mockup APIs ─────────────────────────────────────────────────────

    def create_mockup_task(
        self,
        catalog_product_id: int,
        variant_ids: list[int],
        files: list[dict],
        format: str = "jpg",
    ) -> dict:
        """Create an async mockup generation task."""
        return self.post(
            f"/mockup-generator/create-task/{catalog_product_id}",
            {
                "variant_ids": variant_ids,
                "format": format,
                "files": files,
            },
        )

    def get_mockup_result(self, task_key: str) -> dict:
        """Get the result of a mockup generation task."""
        return self.get(f"/mockup-generator/task?task_key={task_key}")

    def wait_for_mockup(
        self, task_key: str, poll_interval: float = 5.0, timeout: float = 120.0
    ) -> dict:
        """Wait for a mockup task to complete."""
        start = time.time()
        time.sleep(10)  # First poll after 10s per Printful docs

        while time.time() - start < timeout:
            result = self.get_mockup_result(task_key)
            if result["status"] in ("completed", "error"):
                return result
            time.sleep(poll_interval)

        raise TimeoutError(f"Mockup task {task_key} timed out after {timeout}s")

    # ─── Webhook APIs ────────────────────────────────────────────────────

    def setup_webhooks(self, webhook_url: str) -> dict:
        """Register webhook URL for product sync events."""
        return self.post(
            "/webhooks",
            {
                "url": webhook_url,
                "types": [
                    "product_synced",
                    "product_updated",
                    "product_deleted",
                    "stock_updated",
                ],
            },
        )

    def get_webhook_config(self) -> dict:
        return self.get("/webhooks")

    def disable_webhooks(self) -> dict:
        return self.delete("/webhooks")

    # ─── Order APIs ──────────────────────────────────────────────────────

    def create_order(self, order_data: dict) -> dict:
        """Create a fulfillment order in Printful."""
        return self.post("/orders", order_data)


# ──────────────────────────────────────────────────────────────────────────────
# Variant Attribute Parser
# ──────────────────────────────────────────────────────────────────────────────


def parse_variant_attributes(variant: dict) -> tuple[Optional[str], Optional[str]]:
    """
    Extract color and size from variant data.
    Priority: explicit fields > options array > name parsing.

    Returns: (color, size) tuple
    """
    # 1. Explicit fields
    color = variant.get("color")
    size = variant.get("size")
    if color or size:
        return color, size

    # 2. Options array
    for opt in variant.get("options", []):
        if opt.get("id", "").lower() == "color":
            color = opt["value"]
        if opt.get("id", "").lower() == "size":
            size = opt["value"]
    if color or size:
        return color, size

    # 3. Parse from name
    import re

    parts = [part.strip() for part in re.split(r"[-/]", variant.get("name", "")) if part.strip()]
    size_pattern = re.compile(r"^(XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|\d+XL)$", re.IGNORECASE)

    size = next((p for p in parts if size_pattern.match(p)), None)
    color = next(
        (p for p in parts if not size_pattern.match(p) and p != parts[0]),
        None,
    ) if len(parts) > 1 else None

    return color, size


def extract_variant_images(variant: dict) -> list[dict]:
    """Extract deduplicated image URLs with type metadata from variant files."""
    seen = set()
    images = []

    for f in variant.get("files", []):
        url = f.get("preview_url") or f.get("url")
        if url and url not in seen:
            seen.add(url)
            images.append({"url": url, "type": f.get("type", "preview")})

    return images


# ──────────────────────────────────────────────────────────────────────────────
# Database Syncer (PostgreSQL)
# ──────────────────────────────────────────────────────────────────────────────


class ProductSyncer:
    """
    Syncs Printful products into a PostgreSQL database.

    Features:
        - Idempotent upsert (no duplicates)
        - Color/size extraction
        - Image persistence
        - Soft-delete for removed products
        - SyncLog audit trail
    """

    def __init__(self, client: PrintfulClient, db_url: Optional[str] = None):
        if psycopg2 is None:
            raise ImportError("psycopg2 is required: pip install psycopg2-binary")

        self.client = client
        self.db_url = db_url or os.environ.get("DATABASE_URL")
        if not self.db_url:
            raise ValueError("DATABASE_URL is required")

    def _get_conn(self):
        return psycopg2.connect(self.db_url)

    def full_sync(self) -> dict:
        """
        Full sync: fetch all products from Printful and upsert into the database.
        Returns stats: {product_count, variant_count, created, updated, deleted}
        """
        conn = self._get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        stats = {
            "product_count": 0,
            "variant_count": 0,
            "created": 0,
            "updated": 0,
            "deleted": 0,
        }

        # Create sync log
        now = datetime.now(timezone.utc)
        cur.execute(
            """
            INSERT INTO "SyncLog" (id, status, "startedAt", "triggerType")
            VALUES (gen_random_uuid(), 'RUNNING', %s, 'MANUAL')
            RETURNING id
            """,
            (now,),
        )
        sync_log_id = cur.fetchone()["id"]
        conn.commit()

        try:
            details = self.client.get_all_product_details()
            valid_product_ids = []
            valid_variant_ids = []

            for pd in details:
                sp = pd["sync_product"]
                variants = pd["sync_variants"]
                if not sp or not variants:
                    continue

                provider_id = str(sp["id"])
                valid_product_ids.append(provider_id)

                # Compute minimum price
                prices = [float(v.get("retail_price", 0)) for v in variants]
                min_price = min(prices) if prices else 0

                # Collect images
                images = []
                if sp.get("thumbnail_url"):
                    images.append(sp["thumbnail_url"])
                for v in variants:
                    for f in v.get("files", []):
                        if f.get("type") == "preview":
                            url = f.get("preview_url") or f.get("url")
                            if url and url not in images:
                                images.append(url)

                # Upsert product
                cur.execute(
                    """
                    INSERT INTO "Product" (id, title, description, price, stock, "providerId", image, images, "isActive", "lastSyncedAt", "createdAt", "updatedAt")
                    VALUES (gen_random_uuid(), %s, %s, %s, 0, %s, %s, %s, true, NOW(), NOW(), NOW())
                    ON CONFLICT ("providerId") DO UPDATE SET
                        title = EXCLUDED.title,
                        price = EXCLUDED.price,
                        image = EXCLUDED.image,
                        images = EXCLUDED.images,
                        "isActive" = true,
                        "lastSyncedAt" = NOW(),
                        "updatedAt" = NOW()
                    RETURNING id, (xmax = 0) AS is_insert
                    """,
                    (
                        sp["name"],
                        sp["name"],
                        min_price,
                        provider_id,
                        sp.get("thumbnail_url"),
                        images,
                    ),
                )
                row = cur.fetchone()
                product_id = row["id"]
                if row["is_insert"]:
                    stats["created"] += 1
                else:
                    stats["updated"] += 1

                stats["product_count"] += 1

                # Upsert variants
                for v in variants:
                    v_provider_id = str(v["id"])
                    valid_variant_ids.append(v_provider_id)
                    stats["variant_count"] += 1

                    color, size = parse_variant_attributes(v)
                    v_images = extract_variant_images(v)
                    main_image = next(
                        (img["url"] for img in v_images if img["type"] == "preview"),
                        sp.get("thumbnail_url"),
                    )

                    cur.execute(
                        """
                        INSERT INTO "Variant" (id, "productId", title, price, stock, "providerId", color, size, image, images, "isActive", "lastSyncedAt")
                        VALUES (gen_random_uuid(), %s, %s, %s, 999, %s, %s, %s, %s, %s, true, NOW())
                        ON CONFLICT ("providerId") DO UPDATE SET
                            "productId" = EXCLUDED."productId",
                            title = EXCLUDED.title,
                            price = EXCLUDED.price,
                            color = EXCLUDED.color,
                            size = EXCLUDED.size,
                            image = EXCLUDED.image,
                            images = EXCLUDED.images,
                            "isActive" = true,
                            "lastSyncedAt" = NOW()
                        """,
                        (
                            product_id,
                            v["name"],
                            float(v.get("retail_price", 0)),
                            v_provider_id,
                            color,
                            size,
                            main_image,
                            [img["url"] for img in v_images],
                        ),
                    )

            # Deactivate orphaned products/variants
            if valid_product_ids:
                cur.execute(
                    """
                    UPDATE "Product" SET "isActive" = false
                    WHERE "providerId" NOT IN %s AND "isActive" = true
                    """,
                    (tuple(valid_product_ids),),
                )
                stats["deleted"] = cur.rowcount

                if valid_variant_ids:
                    cur.execute(
                        """
                        UPDATE "Variant" SET "isActive" = false
                        WHERE "providerId" NOT IN %s AND "isActive" = true
                        """,
                        (tuple(valid_variant_ids),),
                    )

            # Update sync log
            cur.execute(
                """
                UPDATE "SyncLog" SET
                    status = 'SUCCESS',
                    "completedAt" = NOW(),
                    "productCount" = %s,
                    "variantCount" = %s,
                    "createdCount" = %s,
                    "updatedCount" = %s,
                    "deletedCount" = %s
                WHERE id = %s
                """,
                (
                    stats["product_count"],
                    stats["variant_count"],
                    stats["created"],
                    stats["updated"],
                    stats["deleted"],
                    sync_log_id,
                ),
            )

            conn.commit()
            logger.info(f"Sync completed: {stats}")
            return stats

        except Exception as e:
            conn.rollback()
            cur.execute(
                """
                UPDATE "SyncLog" SET
                    status = 'FAILED',
                    "completedAt" = NOW(),
                    "errorMessage" = %s
                WHERE id = %s
                """,
                (str(e)[:2000], sync_log_id),
            )
            conn.commit()
            logger.error(f"Sync failed: {e}")
            raise
        finally:
            cur.close()
            conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# CLI Entry Point
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Printful Product Sync")
    parser.add_argument("--sync", action="store_true", help="Run full product sync")
    parser.add_argument("--webhooks", type=str, help="Register webhook URL")
    parser.add_argument("--list", action="store_true", help="List all sync products")
    args = parser.parse_args()

    client = PrintfulClient()

    if args.sync:
        syncer = ProductSyncer(client)
        result = syncer.full_sync()
        print(f"Sync complete: {result}")

    elif args.webhooks:
        result = client.setup_webhooks(args.webhooks)
        print(f"Webhooks registered: {result}")

    elif args.list:
        products = client.get_sync_products()
        for p in products:
            print(f"  [{p['id']}] {p['name']} ({p.get('synced', 0)} variants)")
        print(f"\nTotal: {len(products)} products")

    else:
        parser.print_help()
