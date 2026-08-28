CHIC.RS — FIXED ADMIN VERSION

OVO IZDANJE NE KORISTI NETLIFY DATABASE/DRIZZLE ZA PROIZVODE.
Proizvodi se čuvaju u Netlify Blobs, a slike se takođe čuvaju u Netlify Blobs.
Time je uklonjen uzrok prethodnih grešaka sa migracijama i verzijama ORM-a.

POSTAVLJANJE:
1. Uploaduj sadržaj ovog ZIP-a na GitHub repo ili Netlify.
2. Netlify Build command: npm run build
3. Publish directory: .
4. Functions directory: netlify/functions

ADMIN:
Klikni ADMIN na sajtu.
Podrazumevana lozinka: chic2026
Ako u Netlify Environment variables postaviš ADMIN_PASSWORD, koristiće se ta lozinka.

ADMIN PODRŽAVA:
- dodavanje proizvoda
- izmenu i brisanje
- dostupno / nedostupno
- broj komada
- cenu
- veličine
- kategoriju
- brend
- oznaku
- opis
- poziciju
- više slika po proizvodu
- menjanje glavne slike i redosleda slika

DOSTAVA: 680 RSD

Napomena: postojeći proizvodi iz stare Netlify Database tabele nisu automatski kopirani u Blobs. Ovaj paket ima 3 početna proizvoda i nakon toga sve izmene radiš iz Admin panela.
