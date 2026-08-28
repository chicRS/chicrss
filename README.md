# Chic.rs — bela/crna Netlify prodavnica

Ovo je gotova verzija Chic.rs sa belim/cream dizajnom i crnim detaljima.

## Šta je urađeno
- novi Chic logo kao `assets/logo.png`
- profilna slika kao `assets/profile.jpg`
- početna hero galerija koja automatski menja slike
- hero galerija prikazuje logo, profilnu sliku i glavne slike proizvoda koje dodaš kroz Admin
- strelice i tačkice za ručno menjanje hero slika
- više slika po svakom proizvodu
- galerija proizvoda sa strelicama i thumbnail slikama
- u Adminu: dodavanje, izmena i brisanje proizvoda
- cena, veličine, kategorija, brend, opis, oznaka, pozicija
- status DOSTUPNO / NEDOSTUPNO
- količina komada na stanju
- više slika odjednom
- menjanje redosleda slika, glavna slika i brisanje slike
- automatski prikaz DOSTUPNO / RASPRODATO prema stanju
- pretraga i filteri
- korpa i checkout
- dostava 680 RSD
- zamena veličine uz prethodni dogovor
- Netlify Functions + Netlify Blobs + Drizzle
- SQL migracije za dodatna polja baze

## Admin
Podrazumevana lozinka je `chic2026` ako u Netlify Environment Variables nije postavljen `ADMIN_PASSWORD`.

Za produkciju postavi:
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

## Deploy
Repo poveži sa Netlify i koristi root folder projekta. Build command je `npm run build`, a publish directory je `.`.

Ako Netlify traži primenu nove DB migracije, primeni SQL fajlove iz `netlify/database/migrations/`.
