# where2find4you.com

**We help people find places — and help places get found.**

where2find4you.com is an AI-powered local discovery MVP for places, services,
experiences, restaurants, attractions, hotels, cafés, shops, marinas, activities
and local businesses.

## Install

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local` and add values when you connect real services:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=https://where2find4you.com
NEXT_PUBLIC_DONATION_URL=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=
ADMIN_PASSWORD=
TYPESENSE_HOST=
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=
TYPESENSE_SEARCH_ONLY_API_KEY=
TYPESENSE_COLLECTION=places_v1
```

The MVP works with local seed data without credentials.
`NEXT_PUBLIC_DONATION_URL` is legacy and optional.
`NEXT_PUBLIC_STRIPE_PAYMENT_LINK` is optional and should contain a Stripe
Payment Link for upgrade/donation buttons. If it is empty, payment buttons are
hidden or disabled. `ADMIN_PASSWORD` is server-only and must not use the
`NEXT_PUBLIC_` prefix.
`NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` is optional and can contain the public Amazon
Associates tracking tag to append to pasted Amazon product links in admin.

## Typesense Search

Typesense is the primary Search v2 index. The database remains the source of
truth, and the app falls back to Supabase/static search if Typesense is not
configured or unavailable.

Local Typesense:

```bash
docker compose -f docker-compose.typesense.yml up
```

Local env:

```env
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=local-typesense-admin-key
TYPESENSE_COLLECTION=places_v1
```

Backfill/reindex:

```bash
npm run search:reindex
```

The Typesense admin key is server-only. Do not expose it with a
`NEXT_PUBLIC_` prefix. See `SEARCH.md` for schema, ranking, synonyms and debug
notes.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor or through migrations.
3. Generate the seed SQL:

```bash
npm run seed:places
```

4. Run `supabase/seed.sql` in the SQL editor.
5. Copy the project API values into `.env.local` for local testing and into Vercel
   for deployment:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=https://where2find4you.com
NEXT_PUBLIC_DONATION_URL=
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=
ADMIN_PASSWORD=
```

The Supabase secret key is only used inside server routes. Do not expose it with
a `NEXT_PUBLIC_` prefix. If your Supabase dashboard still shows legacy keys, the
app also accepts `SUPABASE_SERVICE_ROLE_KEY`.

If you already created the tables from an older UUID-based draft schema, reset
those MVP tables first or create a fresh Supabase project before running the
current schema.

## Production Tracking

The app keeps local seed analytics for development and also writes real events
to Supabase when `NEXT_PUBLIC_SUPABASE_URL` and either `SUPABASE_SECRET_KEY` or
`SUPABASE_SERVICE_ROLE_KEY` are configured.

Tracked MVP events:

- Search records from `/search` and `/api/search`.
- Result impressions for shown places.
- Place profile views from the browser after the profile page loads.
- Clicks for profile, website, map, phone, booking, claim and promote actions.

To test tracking after deployment:

1. Open `/search?q=quiet cafe in Oslo`.
2. Click a result profile.
3. Open the place website, map or phone action.
4. In Supabase Table Editor, check `searches`, `place_impressions`,
   `place_views` and `place_clicks`.

## Main Pages

- `/` - Mobile-first homepage with hero search, examples, categories and business CTA.
- `/search` - Search results with filters, sponsored listings and sorting controls.
- `/place/[id]` - Place profile with map, website, phone, claim and promote CTAs.
- `/business` - Business positioning and contact placeholder.
- `/about` - Concept and privacy explanation.
- `/contact` - Contact form placeholder.

## Admin

- `/admin` - Overview dashboard with searches, impressions, clicks, views and top lists.
- `/admin/places` - Places management and add/edit placeholder form.
- `/admin/products` - Patchen: paste affiliate products, preview cards and copy JSON.
- `/admin/import` - OpenStreetMap / Overpass import form placeholder.
- `/admin/analytics/[slug]` - Per-place analytics.
- `/admin/leads` - High-interest places to contact for paid promotion.

Admin access is protected server-side. Set `ADMIN_PASSWORD` in local and
deployment environment variables, open `/admin`, then sign in with that
password. Normal public navigation does not show admin links. If
`ADMIN_PASSWORD` is missing, `/admin/login` shows a configuration error.

Patchen at `/admin/products` accepts one product per line.
Use a plain URL, or paste `Title | URL | Description | Image URL | Price |
Category`. Amazon links get `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` added when it is
configured and no `tag=` parameter exists. The MVP keeps saved product drafts in
the admin browser's local storage; copy the generated JSON when you are ready to
move the list into persistent content. Keep the visible affiliate disclosure on
pages that use affiliate links.

## API Routes

- `GET /api/search?q=...`
- `POST /api/track/impression`
- `POST /api/track/click`
- `POST /api/track/view`
- `POST /api/import/osm`
- `GET|POST /api/admin/places`
- `GET /api/analytics/summary`

## OpenAI-Ready Architecture

`lib/ai/recommendPlaces.ts` contains a deterministic fallback search and clear
TODO placement for OpenAI API intent parsing and ranking.

## OpenStreetMap Import

The import path uses Overpass API and does not scrape Google Maps. To test:

```bash
npm run dev
node scripts/import-osm.mjs
```

For a first pilot, change the import area in the admin form or set environment
variables:

```bash
IMPORT_AREA_NAME=Oslo IMPORT_LIMIT=200 node scripts/import-osm.mjs
```

## Vercel Deployment

1. Push the repo to GitHub.
2. Import the GitHub repo in Vercel as a Next.js project.
3. Keep the default build command, which now runs:

```bash
npm run build
```

4. Add the environment variables from `.env.example` to Vercel Production and
   Preview environments.
5. Deploy.
6. In Vercel, add `where2find4you.com` and `www.where2find4you.com`.
7. Update DNS at the domain registrar according to Vercel's instructions.
8. Set `NEXT_PUBLIC_SITE_URL=https://where2find4you.com` in Vercel and redeploy.

For the existing Sites/Cloudflare workflow, use `npm run build:sites`.

## Real Business MVP Launch Path

1. GitHub: create a private repo, push this code, and use `main` as production.
2. Supabase: create project, run `supabase/schema.sql`, run `npm run seed:places`,
   then run `supabase/seed.sql`.
3. Vercel: import from GitHub, add environment variables, deploy a preview, then
   promote to production.
4. Domain: add `where2find4you.com` and `www.where2find4you.com` in Vercel, then
   apply the DNS records at the registrar.
5. Tracking test: run the search/profile/click test above and confirm rows appear
   in Supabase.

## Responsive Testing

Test these widths in browser dev tools:

- 375px mobile
- 430px large mobile
- 768px tablet
- 1024px small laptop/tablet landscape
- 1440px desktop
- 1920px large desktop

Admin tables intentionally use horizontal scroll on small screens; public pages
avoid fixed-width layouts.
