# Chic.rs — kompletna verzija

Ovo je kompletan redizajn postojećeg Chic.rs projekta, uz zadržan Netlify backend, admin prijavu, bazu, Blobs slike i Netlify Forms porudžbine.

## Admin mogućnosti
- dodavanje proizvoda
- uređivanje proizvoda
- brisanje proizvoda
- više slika po proizvodu
- pregled svih sačuvanih slika
- dodavanje novih slika bez brisanja starih
- ↑ / ↓ menjanje redosleda slika
- ★ postavljanje glavne slike
- × brisanje slike
- brend
- kategorija
- veličine
- količina na stanju
- oznaka NEW / SALE / BESTSELLER
- pozicija proizvoda na shopu
- ↑ / ↓ pomeranje proizvoda na sajtu

## Shop
- srpski jezik
- pretraga po nazivu i brendu
- kategorije
- filter brenda
- filter veličine
- filter cene
- dostupno / rasprodato
- sortiranje po poziciji, datumu i ceni
- više slika na kartici sa strelicama
- detaljan prikaz proizvoda sa galerijom
- korpa i postojeći checkout

## VAŽNO — baza
Nova verzija dodaje kolone:
- `brand`
- `stock`
- `sort_order`

U folderu `netlify/database/migrations/20260828180000_add_product_management_fields/` nalazi se SQL migracija.

Ako tvoj Netlify projekat ne primenjuje migracije automatski, potrebno je jednom izvršiti taj SQL nad Netlify bazom pre korišćenja novih admin polja.

## Admin lozinka
Postojeća podrazumevana lozinka u kodu je `chic2026`, ali za pravi sajt obavezno podesi Netlify environment variables:
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## Deploy
Zadrži ceo projekat zajedno. Nemoj brisati:
- `netlify/functions`
- `netlify/database`
- `db`
- `netlify.toml`
- `package.json`
