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

## Website beheren met Pages CMS

De zichtbare website-inhoud wordt beheerd met Astro content collections en kan zonder lokale ontwikkelomgeving worden bijgewerkt via [Pages CMS](https://app.pagescms.org):

1. Meld aan met GitHub.
2. Installeer de Pages CMS GitHub App uitsluitend voor de repository `AjdinDev/sidelineaction`.
3. Gebruik **Website-inhoud** om algemene gegevens, pagina's, SEO-tekst, afbeeldingen en herhaalbare blokken zoals FAQ's, apparatuur, processtappen en afspraken te bewerken.
4. Beheer de keuzelijst voor het type shoot onder **Shoottypes**.
5. Open **Portfolio** om een shoot te maken of te bewerken, selecteer het type uit de keuzelijst en voeg de cover en galerijfoto's toe.

Pages CMS gebruikt `.pages.yml` als configuratie en schrijft content en afbeeldingen rechtstreeks naar GitHub. Wanneer Workers Builds voor `main` is gekoppeld zoals hierboven beschreven, start een CMS-wijziging automatisch een nieuwe build. De bestaande liveversie blijft beschikbaar wanneer een build door ongeldige content zou falen.

Nieuwe portfolio-items krijgen hun URL van de bestandsnaam die bij het aanmaken wordt gekozen. Die bestandsnaam kan daarna niet via Pages CMS worden hernoemd, zodat bestaande portfolio-URL's stabiel blijven. Hetzelfde geldt voor de bestandsnaam van een shoottype, omdat portfolio-items ernaar verwijzen. Een coverfoto moet ook in de galerij voorkomen. Het Astro-schema en de build controleren verplichte velden, datumnotatie, dubbele foto's, ontbrekende covers, verwijzingen naar shoottypes en de uitgelichte homepage-shoot.

Waarden zoals de naam, regio, levertijd en aantallen worden centraal beheerd onder **Algemene instellingen**. Paginacontent kan de bestaande tokens gebruiken, bijvoorbeeld `{brand_name}`, `{photographer_name}`, `{region}`, `{delivery_days}`, `{photo_minimum}` en `{photo_range}`. Routes, de visuele layout, de veldnamen van het boekingsformulier en de Cloudflare Worker blijven bewust code-beheerd.

## Content structure

- `src/pages/` — one Astro file per public route
- `src/layouts/` — shared document metadata and site shell
- `src/components/` — shared header, footer, loader, and lightbox
- `src/content/site/` — CMS-editable shared settings and reusable values
- `src/content/pages/` — CMS-editable content for each fixed page
- `src/content/shoot-types/` — CMS-managed choices for the portfolio shoot-type dropdown
- `src/content/shoots/` — one CMS-editable content file per portfolio shoot
- `src/content.config.ts` — content schemas and validation
- `src/data/content.ts` — singleton page loading and shared token resolution
- `src/data/shoots.ts` — typed portfolio loading, reference resolution, ordering, and validation helpers
- `src/assets/portfolio/` — CMS-managed portfolio photography
- `src/scripts/` — progressively enhanced menu, gallery, and form behavior
- `worker/index.ts` — validated Worker route for booking notifications
- `public/assets/` — remaining static brand and site assets
- `public/_headers` — Cloudflare Workers Static Assets security and cache headers
