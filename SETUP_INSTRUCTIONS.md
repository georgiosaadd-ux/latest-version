# Checkout Setup Instructions

## The Problem
You're seeing "Configuration error. Please contact support." because the Supabase environment variables are not configured.

## Quick Fix (5 minutes)

### Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (something like `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 2: Create Environment File

In the `latest-version` folder, create a file named `.env` (not `.env.example`):

```bash
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

Replace the placeholders with your actual values from Step 1.

### Step 3: Restart Your Dev Server

Stop your current dev server (Ctrl+C) and restart it:

```bash
npm run dev
```

### Step 4: Test

1. Add items to cart
2. Click checkout
3. Fill in your contact info
4. Click "Complete Purchase"
5. You should be redirected to Stripe checkout! ✅

## Troubleshooting

**Still getting "Configuration error"?**
- Make sure the `.env` file is in the `latest-version` folder (same folder as `package.json`)
- Make sure there are no quotes around the values in `.env`
- Make sure there are no spaces: `VITE_SUPABASE_URL=https://...` not `VITE_SUPABASE_URL = https://...`
- Restart your dev server after creating/editing `.env`

**Getting network errors?**
- Verify your Supabase Edge Function is deployed
- Check that your Edge Function is named `create-checkout-session`

## What Changed?

The checkout button now:
1. ✅ Gathers cart items and customer info
2. ✅ Calls `createCheckoutSession()` with proper payload
3. ✅ Handles errors gracefully (shows alert)
4. ✅ Redirects to Stripe checkout URL

The only missing piece was the environment configuration!

