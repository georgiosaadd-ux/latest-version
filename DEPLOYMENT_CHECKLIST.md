# Deployment Checklist

## ✅ Ready to Push to GitHub?

Before pushing, make sure:

### 1. Code Changes Are Complete ✅
- [x] Checkout button calls `createCheckoutSession()`
- [x] Error handling implemented
- [x] Redirects to Stripe checkout URL
- [x] TypeScript/React functional component style
- [x] Uses async/await properly

### 2. Environment Variables Setup

**For Local Development (.env file):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**For Netlify (configure in dashboard):**
1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Add these two:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

### 3. Supabase Edge Functions Deployment

Your Edge Functions need to be deployed to Supabase. Run:

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the Edge Functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-checkout-webhook
supabase functions deploy send-ebook-email
supabase functions deploy generate-download
```

### 4. Configure Supabase Edge Function Secrets

In your Supabase Dashboard:
1. Go to **Edge Functions** → **Secrets**
2. Add these secrets:
   - `STRIPE_SECRET_KEY` = your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = your Stripe webhook secret
   - `SUPABASE_URL` = your Supabase project URL (it should auto-fill)
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key

### 5. Configure Stripe Webhooks

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Create a new webhook endpoint pointing to:
   ```
   https://your-project.supabase.co/functions/v1/stripe-checkout-webhook
   ```
3. Select events to listen for:
   - `checkout.session.completed`

4. Copy the webhook secret and add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### 6. Push to GitHub

```bash
git add .
git commit -m "Implement Supabase checkout integration"
git push
```

### 7. Deploy on Netlify

If you have auto-deploy enabled, Netlify will build automatically.
Otherwise, go to Netlify Dashboard and trigger a manual deploy.

**Build Command:** `npm install && npm run build`
**Publish Directory:** `dist`

### 8. Test the Deployment

1. Visit your live site
2. Add items to cart
3. Click checkout
4. Fill in contact info
5. Should redirect to Stripe checkout ✅

## ⚠️ Common Issues

**"Configuration error" on Netlify?**
- Make sure you added environment variables in Netlify dashboard
- Variables must start with `VITE_` for Vite to inject them

**"Failed to create checkout session" error?**
- Verify Supabase Edge Functions are deployed
- Check Supabase Edge Function logs for errors
- Ensure `STRIPE_SECRET_KEY` is set in Supabase secrets

**Webhook not working?**
- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` is set in Supabase secrets
- Check Supabase Edge Function logs

## 📝 Summary

You can push to GitHub **now**, but you need to:

1. ✅ Add environment variables to Netlify dashboard
2. ✅ Deploy Supabase Edge Functions
3. ✅ Configure Supabase secrets
4. ✅ Configure Stripe webhook
5. ✅ Test on live site

The `.env` file won't be pushed (it's in `.gitignore`), which is good for security!

