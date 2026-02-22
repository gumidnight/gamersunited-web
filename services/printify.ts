/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Printify Integration Service
 * 
 * Handles interaction with Printify to fetch products and submit orders.
 * Follows official Printify API documentation.
 */

const PRINTIFY_API_URL = "https://api.printify.com/v1";
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const API_KEY = process.env.PRINTIFY_API_KEY;

const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
};

export async function getPrintifyProducts() {
    if (!SHOP_ID || !API_KEY) throw new Error("Printify credentials missing.");

    const res = await fetch(`${PRINTIFY_API_URL}/shops/${SHOP_ID}/products.json`, {
        headers,
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.statusText}`);
    }

    const data = await res.json();
    return data.data; // Array of products
}

export async function createPrintifyOrder(orderData: any) {
    if (!SHOP_ID || !API_KEY) throw new Error("Printify credentials missing.");

    // orderData must match Printify's Create Order API structure
    const res = await fetch(`${PRINTIFY_API_URL}/shops/${SHOP_ID}/orders.json`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            external_id: orderData.external_id,
            line_items: orderData.items,
            shipping_method: 1, // 1 = Standard
            send_shipping_notification: true,
            address_to: {
                first_name: orderData.shipping.first_name,
                last_name: orderData.shipping.last_name,
                email: orderData.customer.email,
                phone: orderData.shipping.phone,
                country: orderData.shipping.country,
                region: orderData.shipping.state,
                address1: orderData.shipping.address1,
                address2: orderData.shipping.address2,
                city: orderData.shipping.city,
                zip: orderData.shipping.zip
            }
        }),
    });

    if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Failed to create Printify order: ${res.statusText} ${errorBody}`);
    }

    return res.json();
}
