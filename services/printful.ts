/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Printful Integration Service
 * 
 * Handles interaction with Printful API to fetch products and submit orders.
 * Follows official Printful API documentation (REST).
 * https://developers.printful.com/docs/
 */

const PRINTFUL_API_URL = "https://api.printful.com";
const API_KEY = process.env.PRINTFUL_API_KEY;

function getHeaders() {
    if (!API_KEY) {
        throw new Error("Printful API Key is missing. Check your environment variables.");
    }
    return {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "X-PF-Language": "en"
    };
}

/**
 * Get all configured products from the Printful store.
 */
export async function getPrintfulProducts() {
    const res = await fetch(`${PRINTFUL_API_URL}/store/products`, {
        headers: getHeaders(),
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch Printful products: ${res.statusText}`);
    }

    const data = await res.json();

    // Printful /store/products only returns basic product list.
    // To get variants and detailed info, we need to fetch each product individually.
    // For small merch shops, this is usually fine, but keep API rate limits in mind.
    const productsDetails = await Promise.all(
        data.result.map(async (product: any) => {
            const detailRes = await fetch(`${PRINTFUL_API_URL}/store/products/${product.id}`, {
                headers: getHeaders(),
                next: { revalidate: 3600 }
            });
            const detailData = await detailRes.json();
            return detailData.result;
        })
    );

    return productsDetails;
}

/**
 * Creates an order in Printful.
 */
export async function createPrintfulOrder(orderData: any) {
    const res = await fetch(`${PRINTFUL_API_URL}/orders`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            external_id: orderData.external_id,
            recipient: {
                name: `${orderData.shipping.first_name} ${orderData.shipping.last_name}`,
                address1: orderData.shipping.address1,
                address2: orderData.shipping.address2,
                city: orderData.shipping.city,
                state_code: orderData.shipping.state,
                country_code: orderData.shipping.country,
                zip: orderData.shipping.zip,
                email: orderData.customer.email,
                phone: orderData.shipping.phone,
            },
            items: orderData.items.map((item: any) => ({
                sync_variant_id: item.variant_id, // External variant map
                quantity: item.quantity,
                // price can be overridden or handled by printful default
            }))
        }),
    });

    if (!res.ok) {
        const errorBody = await res.text();
        console.error("Printful API Error:", errorBody);
        throw new Error(`Failed to create Printful order: ${res.statusText}`);
    }

    return res.json();
}
