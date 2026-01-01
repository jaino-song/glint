# Pre-Production Checklist

## Stripe
- [ ] Create webhook endpoint in Stripe Dashboard and add `STRIPE_WEBHOOK_SECRET`
- [ ] Switch from test keys to live keys (`sk_live_*`, `pk_live_*`)

## Toss Payments
- [ ] Add `TOSS_SECRET_KEY`
- [ ] Add `TOSS_CLIENT_KEY`
- [ ] Add `TOSS_WEBHOOK_SECRET`

## Database
- [ ] Update `DIRECT_URL` to use direct connection (currently using pooler URL)
  - Current: `...pooler.supabase.com:5432/postgres`
  - Should be: `...db.[project-ref].supabase.co:5432/postgres`

## Analytics & Monitoring
- [ ] Add `POSTHOG_API_KEY` (product analytics)
- [ ] Add `SENTRY_DSN` (optional - error monitoring)

## Security
- [ ] Rotate all API keys and secrets
- [ ] Ensure `.env` files are not committed to git
