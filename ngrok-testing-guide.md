# Development Testing with ngrok

This guide explains how to test the Gamers United Next.js application locally in a production-like environment and expose it to the internet using `ngrok`. This is crucial for testing webhooks (like Stripe) and OAuth callbacks (like Discord) before deploying to Cloudflare Pages.

## Prerequisites

1.  **ngrok account:** You need an account at [ngrok.com](https://ngrok.com/).
2.  **ngrok CLI:** Install the ngrok CLI on your machine.
3.  **Environment Variables:** Ensure your `.env` file is properly configured.

## Step 1: Start ngrok

First, start ngrok to get your public URL. This URL will change every time you restart ngrok (unless you have a paid plan with a static domain).

```bash
ngrok http 3000
```

Copy the `Forwarding` URL (e.g., `https://a1b2c3d4.ngrok-free.app`).

## Step 2: Update Environment Variables

Update your local `.env` file to use the ngrok URL.

```env
# NextAuth Configuration
NEXTAUTH_URL="https://a1b2c3d4.ngrok-free.app"
# Or for NextAuth v5 (Auth.js):
AUTH_URL="https://a1b2c3d4.ngrok-free.app"

# Other variables remain the same
DATABASE_URL="..."
DISCORD_CLIENT_ID="..."
DISCORD_CLIENT_SECRET="..."
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
PRINTIFY_SHOP_ID="..."
PRINTIFY_API_KEY="..."
```

## Step 3: Update Provider Callbacks

### Discord OAuth

1.  Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2.  Select your application.
3.  Go to **OAuth2**.
4.  Add your ngrok callback URL to the **Redirects** list:
    `https://a1b2c3d4.ngrok-free.app/api/auth/callback/discord`
5.  Save changes.

*Note: You must update this URL in the Discord Developer Portal every time your ngrok URL changes.*

### Stripe Webhooks

1.  Go to the [Stripe Dashboard](https://dashboard.stripe.com/).
2.  Navigate to **Developers** -> **Webhooks**.
3.  Click **Add an endpoint**.
4.  Set the Endpoint URL to:
    `https://a1b2c3d4.ngrok-free.app/api/webhooks/stripe`
5.  Select the events you want to listen to (e.g., `checkout.session.completed`).
6.  Click **Add endpoint**.
7.  Reveal the **Signing secret** and update your `.env` file:
    `STRIPE_WEBHOOK_SECRET="whsec_..."`

## Step 4: Run Next.js in Production Mode

To test the application exactly as it will run on Cloudflare Pages, build and start it in production mode.

```bash
# 1. Build the application
npm run build

# 2. Start the production server
npm run start
```

The application is now running locally on port 3000 and is accessible globally via your ngrok URL.

## Step 5: Testing

1.  Open your ngrok URL in a browser.
2.  **Test OAuth:** Click the "Login" button and verify that the Discord authentication flow works and redirects you back to the application successfully.
3.  **Test Stripe:** Initiate a checkout flow (if implemented) and verify that the webhook is received by your local server and processed correctly. You can monitor webhook deliveries in the Stripe Dashboard.
4.  **Test API Routes:** Test any other API routes that require external access.

## Limitations and Notes

*   **Dynamic URLs:** Free ngrok accounts have dynamic URLs. You must update your `.env` file, Discord OAuth settings, and Stripe Webhook settings every time you restart ngrok.
*   **OAuth Providers:** Some OAuth providers may have strict requirements for redirect URLs (e.g., requiring HTTPS, which ngrok provides). Always ensure the exact ngrok URL is registered.
*   **Performance:** ngrok adds a layer of latency. Performance testing should be done on the actual deployment platform (Cloudflare Pages).
*   **Security:** Do not share your ngrok URL publicly if your local environment contains sensitive data or is not fully secured.
