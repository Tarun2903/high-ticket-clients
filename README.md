# The High-Ticket Numerology Blueprint – Landing Page

Mobile-first, direct-response landing page for a ₹9 live workshop, built for Meta Ads (Facebook/Instagram) traffic.
Next.js 16 (App Router) + TypeScript, no UI libraries.

## Run

```bash
npm install
cp .env.example .env.local     # fill in what you have; everything is optional in Phase 1
npm run dev                    # http://localhost:3000
```

| Script | |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` / `npm start` | production build / server |
| `npm run typecheck` | TypeScript |
| `npm test` | unit tests (price, validation, attribution, Razorpay signatures, CAPI payloads) |

Design preview of the success page (dev only): `http://localhost:3000/payment/success?preview=1`

## Where things live

```
lib/workshop.ts            OFFER CONFIG – name, day, time, price (paise). Change price here only.
lib/content.ts             ALL PAGE COPY (client-supplied source of truth)
app/globals.css            design tokens (top of file) + all styles
app/page.tsx               section order
components/sections/*      Hero, Problem, Shift, Modules, BigPicture, CaseStudies, Host, Audience, Details, FAQ, FinalCta
components/registration/   RegistrationProvider (the ONE registration action), RegisterButton, FloatingCta, RegistrationDialog
lib/payment/               payment service: types, client (startCheckout), server (orders, verification), signature
lib/tracking/              attribution (UTM/fbclid) + browser events (Pixel / dataLayer / CAPI beacon)
lib/meta.ts                Conversions API payload + hashing
app/api/checkout           create order (Phase 1: returns "unavailable")
app/api/payments/verify    verify Razorpay signature (Phase 2 placeholder, returns 501)
app/api/razorpay/webhook   Razorpay webhook: signature check, idempotent paid/failed updates in Upstash Redis
app/api/events             CAPI relay for ViewContent / InitiateCheckout (rejects Purchase)
app/payment/success        shows WhatsApp link ONLY for a server-verified registration
app/payment/failed         retry page
app/privacy|terms|refund-policy|contact   policy pages (placeholders – Razorpay requires them)
```

## Registration journey

1. Any CTA → `RegistrationProvider.openRegistration()` → fires **InitiateCheckout** (once) → opens dialog.
2. Dialog collects name, WhatsApp, email → `startCheckout()` → `POST /api/checkout`.
3. **Phase 1:** server answers `unavailable`; the dialog shows "registration isn't open yet". No order, no charge, no fake success.
4. **Phase 2:** server creates a Razorpay order (amount from `lib/workshop.ts`, never from the browser) →
   Razorpay Checkout → `POST /api/payments/verify` (signature check) → registration marked paid →
   CAPI **Purchase** → redirect to `/payment/success?registration=…` → WhatsApp group button.

Step-by-step Phase 2 instructions are in comments in `lib/payment/server.ts`, `lib/payment/client.ts`
and the two `app/api/payments/*` routes. A database is needed for registrations in Phase 2.

## Tracking

| Event | When | Browser | Server (CAPI) |
| --- | --- | --- | --- |
| PageView | page load | Pixel base code | – |
| ViewContent | landing page viewed (once) | `trackEvent` | `/api/events`, same event_id |
| InitiateCheckout | registration dialog opened (once per page) | `trackEvent` | `/api/events`, same event_id |
| Purchase | **only after verified payment** | success page, server's event_id, guarded against refresh | verify route (Phase 2) |

- UTM params + `fbclid` are stored in `sessionStorage` and sent with the checkout request.
- Funnel events send no contact details to Meta; Purchase sends hashed email/phone only.
- If you set `NEXT_PUBLIC_GTM_ID`, events are also pushed to `dataLayer`. Don't add Meta tags inside GTM too.

## Before running ads

- [ ] Real case studies, client photos, testimonials, proof (search the site for `[TEAM:`)
- [ ] Verified evidence for the ₹1 crore and ₹30 crore claims
- [ ] Melroy's portrait → `public/images/melroy.jpg`, then set `host.photo` in `lib/content.ts`
- [ ] Workshop date (page currently says "Sunday, 11:00 AM IST")
- [ ] Privacy, Terms, Refund, Contact page content
- [ ] Phase 2: Razorpay + database, `WHATSAPP_GROUP_URL`, Pixel ID + CAPI token, test in Events Manager
