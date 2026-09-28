# Sideline Action

Static Astro website for [sidelineaction.be](https://sidelineaction.be), deployed with Cloudflare Workers Static Assets. A selectively routed Worker handles the booking API and sends a transactional notification through Cloudflare Email Service once the domain and email binding are onboarded.

## Local development

Use Node.js 22 (see `.nvmrc`), then install and run the site:

```bash
npm ci
npm run dev
```

Validation commands:

```bash
npm run check
npm run build
npm run cf:types:check
```

`npm run preview` previews only the static Astro output. `npm run cf:dev` builds the site and starts the complete Workers runtime, including the `/api/booking` route. A successful end-to-end email send still requires an onboarded sender domain and a configured Email Service destination.

## Cloudflare Workers

For Workers Builds Git integration, connect this repository to the `sidelineaction` Worker and use:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root

The repository's `wrangler.jsonc` is the Worker configuration source of truth. It uploads `dist` as static assets, sends only `/api/*` requests through `worker/index.ts`, keeps the `workers.dev` and preview URLs disabled, and defines the `BOOKING_EMAIL` binding.

Before the booking form can send mail:

1. Add `sidelineaction.be` to Cloudflare and attach it as the Worker's custom domain.
2. Onboard `sidelineaction.be` in **Compute → Email Service → Email Sending**, or run `npx wrangler email sending enable sidelineaction.be` after authenticating.
3. Verify `harunviteskic50@gmail.com` as an allowed destination if Cloudflare requests destination verification.
4. Confirm that `website@sidelineaction.be` is accepted as the sender and that the SPF/DKIM records created by Email Service are active.
5. Send one real booking-form submission and verify receipt and reply behavior before announcing the form as live.

The checked-in sender and recipient are non-secret routing configuration. No API token is required by the Function; it uses the native `send_email` binding.

## Direct deployment

Once Cloudflare authentication and Email Service are configured:

```bash
npm run cf:deploy
```

This command builds and deploys the Worker and its `dist` assets together. It is not required when Workers Builds Git integration is enabled.

## Content structure

- `src/pages/` — one Astro file per public route
- `src/layouts/` — shared document metadata and site shell
- `src/components/` — shared header, footer, loader, and lightbox
- `src/data/shoots.ts` — portfolio metadata and photo manifests
- `src/scripts/` — progressively enhanced menu, gallery, and form behavior
- `worker/index.ts` — validated Worker route for booking notifications
- `public/assets/` — extracted, cacheable brand and photography assets
- `public/_headers` — Cloudflare Workers Static Assets security and cache headers
