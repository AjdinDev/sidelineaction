# Sideline Action

Static Astro website for [sidelineaction.be](https://sidelineaction.be), configured for deployment on Cloudflare Pages. The booking form is handled by a Cloudflare Pages Function and sends a transactional notification through Cloudflare Email Service once the domain and email binding are onboarded.

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

`npm run preview` previews the static Astro output. `npm run cf:dev` builds the site and starts the Pages runtime so the Function routes are included. Wrangler simulates the email binding by default and saves the generated message locally; it does not send a real email unless the binding is deliberately changed to remote mode.

## Cloudflare Pages

For Git integration, connect this repository in **Workers & Pages → Create → Pages → Import an existing Git repository** and use:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root

The repository's `wrangler.jsonc` is the Pages configuration source of truth. It defines the static output directory and the `BOOKING_EMAIL` binding used by `functions/api/booking.ts`.

Before the booking form can send mail:

1. Add `sidelineaction.be` to Cloudflare and attach it as the Pages custom domain.
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

This command builds and deploys `dist` to the Pages project named `sidelineaction`. It is not required when Git integration is enabled.

## Content structure

- `src/pages/` — one Astro file per public route
- `src/layouts/` — shared document metadata and site shell
- `src/components/` — shared header, footer, loader, and lightbox
- `src/data/shoots.ts` — portfolio metadata and photo manifests
- `src/scripts/` — progressively enhanced menu, gallery, and form behavior
- `functions/api/booking.ts` — validated Pages Function for booking notifications
- `public/assets/` — extracted, cacheable brand and photography assets
- `public/_headers` — Cloudflare Pages security and cache headers
