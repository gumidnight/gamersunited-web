import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is missing from environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2023-10-16' as any, // Matching webhook route api version
    appInfo: {
        name: 'Gamers United Cyprus',
        version: '0.1.0',
    },
    // Required for Edge runtime (Cloudflare Workers)
    httpClient: Stripe.createFetchHttpClient(),
});
