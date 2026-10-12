# Invio CRM (`crm.inv.timrio.com`)

Production-ready internal CRM, Customer Directory, Support Ticket Management & Discount Administration Web Portal for Invio (Timrio).

## Architecture & Overview

- **Domain:** `https://crm.inv.timrio.com`
- **Backend API:** Connects securely to Invio PostgreSQL cloud backend via `https://api.invio.timrio.com/api/crm/*`
- **Internal Only:** Configured with `noindex, nofollow` and `robots.txt Disallow: /` (no SEO required).
- **Security & RBAC:** Centralized role-based access control with server-side enforcement across 4 internal roles:
  1. **Administrator:** Full authority across discounts, staff, plans, coupons, and immutable audit logs.
  2. **Operations Manager:** Approvals up to 30%, coupon management, staff portfolio delegation (enforces Anti-Self-Approval).
  3. **Sales Executive:** PII-masked customer directory, direct discounts $\le$ 10%, approval requests $\le$ 30%.
  4. **Support Executive:** Omnichannel tickets triage, internal notes vs public replies, customer retention discount requests.

## Development

```bash
# Install dependencies
npm install

# Start local dev server (port 7496)
npm run dev

# Production build
npm run build
```
