# Chic.rs

Chic.rs je online streetwear prodavnica (patike i garderoba) sa admin panelom za upravljanje ponudom, korpom i porudžbinama na pouzeće.

## Tehnologije

- Statički HTML/CSS/JS frontend (bez build koraka)
- Netlify Functions (TypeScript) za API
- Netlify Database (Postgres + Drizzle ORM) za proizvode
- Netlify Blobs za slike proizvoda otpremljene iz admin panela
- Netlify Forms za porudžbine (plaćanje pouzećem)

## Struktura

- `index.html`, `style.css`, `assets/` — sajt
- `netlify/functions/products.mts` — CRUD API za proizvode (`/api/products`)
- `netlify/functions/admin-login.mts`, `admin-logout.mts` — prijava/odjava admina (cookie sesija)
- `netlify/functions/upload.mts`, `image.mts` — otpremanje i prikaz slika proizvoda (Netlify Blobs)
- `db/schema.ts` — Drizzle šema baze
- `netlify/database/migrations/` — migracije baze (uključuju početne proizvode)

## Pokretanje lokalno

```bash
npm install
netlify dev --port 8889
```

Otvori `http://localhost:8889`.

## Admin panel

Klikni **ADMIN** u gornjem desnom uglu. Demo lozinka je `chic2026`.

**Pre javne upotrebe:** podesi environment varijable u Netlify podešavanjima sajta:

- `ADMIN_PASSWORD` — nova admin lozinka
- `ADMIN_SESSION_SECRET` — nasumičan tajni string za potpisivanje sesije

Proizvodi i slike se čuvaju u Netlify bazi/Blobs storage-u, tako da su promene odmah vidljive svim posetiocima na svim uređajima.
