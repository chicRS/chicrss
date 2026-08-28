CHIC.RS — FIXED DEPLOY PACKAGE

Šta je popravljeno:
- izbačen je Drizzle iz runtime-a da se više ne javljaju greške sa verzijama drizzle-orm;
- nema starog package-lock.json koji je vukao stare zavisnosti;
- Netlify Database koristi direktni @netlify/database SQL API;
- nova migracija je na PRAVOM mestu: netlify/database/migrations/<timestamp>_.../migration.sql;
- postojeće products tabele se dopunjavaju brand/stock/sort_order/description kolonama;
- logo je ugrađen kao /chic-logo.svg, pa nema broken-image problema;
- admin podržava dostupno/nedostupno, količinu, cenu, veličine, kategoriju, brend, opis, oznaku, poziciju i više slika;
- slike se čuvaju u Netlify Blobs;
- dostava je 680 RSD;
- admin lozinka: chic2026, osim ako u Netlify Environment Variables imaš ADMIN_PASSWORD.

VAŽNO:
Ovaj ZIP je napravljen da se postavi kao NOVI deploy. Ne ubacuj stari package-lock.json preko ovog paketa.
