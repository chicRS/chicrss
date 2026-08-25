# AGENTS.md

## Architecture

Plain static HTML/CSS/JS storefront (`index.html`, `style.css`) backed by Netlify Functions for all dynamic behavior. No frontend framework or build step — `index.html` is served as-is.

- **Products**: stored in Netlify Database (Postgres) via Drizzle ORM. Schema in `db/schema.ts`, client in `db/index.ts`. All CRUD goes through `netlify/functions/products.mts` (`GET/POST /api/products`, `PUT/DELETE /api/products/:id`).
- **Admin auth**: cookie-based session, not a full identity system. `netlify/functions/lib/admin-auth.ts` signs an HMAC token using `ADMIN_SESSION_SECRET` (falls back to `ADMIN_PASSWORD`, then a dev default). `admin-login.mts` / `admin-logout.mts` set/clear the cookie. Every mutating request to `products.mts` and `upload.mts` calls `isAuthorized(req)`.
- **Product images**: uploaded through the admin panel as base64 JSON to `netlify/functions/upload.mts`, stored in a Netlify Blobs store named `product-images`, served back publicly via `netlify/functions/image.mts` at `/api/images/:key`. Seed products reference static files in `assets/` instead.
- **Checkout**: Netlify Forms (`chic-orders` form in `index.html`), cash-on-delivery only — no payment processor integrated.
- **Cart**: kept in `localStorage` on the client. This is fine because it is per-visitor ephemeral state, not application data — unlike products, it does not need to be shared across devices.

## Conventions

- Functions are TypeScript (`.mts`) with in-code `path` config (see `netlify-functions` skill).
- Schema changes to `db/schema.ts` require a matching migration: `npx drizzle-kit generate --name <change>`. The first migration also seeds the three demo products — do not remove that INSERT without replacing it with real data.
- Frontend JS is intentionally inline in `index.html` (matches the original single-file prototype this was built from) rather than split into modules.

## Non-obvious decisions

- No ORM-level user table / real auth provider — a single shared admin password was judged sufficient for a one-operator shop. If multi-admin or audit trails are needed later, migrate to Netlify Identity.
- Images are stored as opaque Blobs keys behind a serving function rather than as public Blobs URLs, so access could be gated later if needed.
