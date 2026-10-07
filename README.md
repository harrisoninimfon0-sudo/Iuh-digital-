# IUH DIGITAL — Complete Payment Platform Starter

## Included
- PostgreSQL persistence
- Customer accounts
- Hashed API keys
- Payment checkout initialization through Paystack
- Server-side transaction verification
- Signed Paystack webhook handling
- Amount/currency verification
- Refund API
- Email notification hook
- Admin JWT dashboard
- Customer/transaction statistics
- API-key revocation
- Audit-ready webhook event table
- Rate limiting and security headers

## Setup

Requires Node.js 18+ and PostgreSQL.

```bash
npm install
cp .env.example .env
```

Set DATABASE_URL, JWT_SECRET, admin credentials and PAYSTACK_SECRET_KEY.

Then:

```bash
npm run db:migrate
npm start
```

Dashboard:
`http://localhost:3000`

## Customer API

Register:
POST `/v1/auth/register`

Generate an API key:
POST `/v1/auth/api-keys`

Initialize a payment:
POST `/v1/payments`
Header: `x-api-key: iuh_live_...`

The response contains `checkout_url`. Redirect the customer to that URL.

Verify:
POST `/v1/payments/:reference/verify`

Refund:
POST `/v1/refunds`
Body:
`{"reference":"IUH-...","amount":5000,"reason":"Customer request"}`

## Paystack webhook

Configure your Paystack webhook URL as:

`https://YOUR_DOMAIN/v1/webhooks/paystack`

The handler verifies the Paystack signature before processing a successful charge.

## Production checklist

Before live customer use:
- Set NODE_ENV=production.
- Use HTTPS.
- Use a managed PostgreSQL database with backups.
- Store secrets in a proper secrets manager/environment.
- Use a real SMTP provider.
- Configure Paystack live secret keys only on the server.
- Add DNS/domain and monitoring.
- Add idempotency keys for payment/refund requests.
- Add password reset and email verification.
- Add stronger admin RBAC and 2FA.
- Add reconciliation and settlement reporting.
- Review Nigerian payment/financial regulatory obligations and use an appropriately licensed payment provider/structure.
- Never store card PAN, CVV, PIN or banking passwords.
- Test webhook replay/idempotency and failed-payment paths.

This software is an application layer. It does not itself become a bank, wallet, PSP, or money transmitter merely by running it.
