# where2find4you

where2find4you is an AI-powered city discovery MVP for finding free WiFi,
laptop-friendly work spots, quiet cafés, libraries, hotel lobbies, and future
rooftop or hidden-gem locations.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
```

Then open the local URL shown in your terminal.

## Main Routes

- `/` - Home page with city search and popular cities.
- `/city/oslo` - Seeded Oslo results with filters, cards, and a Leaflet map.
- `/place/deichman-bjorvika` - Place detail with scores, source notes, and map.
- `/admin` - Simulated agent runs and a mock Oslo scan button.

## Data

The first MVP uses local TypeScript seed data in `lib/data`. The schema in
`supabase/schema.sql` is compatible with Supabase/Postgres and mirrors the
current TypeScript types.

No paid API keys or environment variables are required for this version.

## Useful Commands

- `npm run dev`: start local development.
- `npm run build`: verify the Sites-compatible vinext build output.
- `npm run lint`: run lint checks.

## Future Integrations

TODO comments are included where real agents can plug in:

- Google Places and OpenStreetMap ingestion.
- OpenAI-based scoring over reviews, photos, and source notes.
- Rooftop and view scoring.
- Scheduled verification jobs for source freshness and opening hours.
