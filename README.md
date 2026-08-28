# Chic.rs

Ready for Netlify deployment.

## Šta je popravljeno
- Logo se učitava preko apsolutne putanje `/chic-logo.png`, pa više ne zavisi od trenutne rute.
- Dodat je isti logo i u `assets/logo.png`.
- API automatski proverava/kreira potrebne kolone za products tabelu (`description`, `brand`, `stock`, `sort_order`, `created_at`) kako bi admin čuvanje radilo i na staroj bazi.
- Admin panel podržava slike, više slika, cenu, veličine, kategoriju, brend, status, količinu, poziciju i opis.

## Admin
Klikni `ADMIN` na sajtu. Podrazumevana lozinka je `chic2026`, osim ako je u Netlify Environment Variables postavljena `ADMIN_PASSWORD`.
