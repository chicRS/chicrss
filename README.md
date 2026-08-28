# Chic.rs — gotova Netlify verzija

Ovaj paket sadrži:
- responsive Chic.rs shop
- Patike / Garderoba kategorije
- pretragu, brend, veličinu, cenu i dostupnost
- više slika po proizvodu
- galeriju i izbor veličine
- korpu i checkout
- dostavu 680 RSD
- zamenu veličine uz prethodni dogovor
- admin prijavu
- dodavanje/izmenu/brisanje proizvoda
- brend, stanje, poziciju i oznaku
- pomeranje proizvoda ↑ ↓
- upload više slika
- Netlify Functions + Drizzle schema + SQL migraciju

## Admin
Podrazumevana lozinka je `chic2026` ako u Netlify Environment Variables nije postavljen `ADMIN_PASSWORD`.

## Važno
Za produkciju postavi `ADMIN_PASSWORD` i `ADMIN_SESSION_SECRET` u Netlify Environment Variables.

Nakon povezivanja repozitorijuma sa Netlify-om, deploy se pokreće automatski.
