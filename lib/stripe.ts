import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
    appInfo: {
        name: 'Gamers United Cyprus',
        version: '0.1.0',
    },
    // Required for Edge runtime (Cloudflare Workers)
    httpClient: Stripe.createFetchHttpClient(),
});
