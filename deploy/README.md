# Gå live med Filmvisarna

Kommandon nedan körs från repots rot om inget annat anges. Projektet har separata `Backend/` och `Frontend/`, men i drift serverar en Node-process både `/api`, `/uploads` och `Frontend/dist`.

## Del 1: bygg och testa lokalt

Använd Node 22.12 eller senare. Installera först beroenden med `npm run setup` (kör `npm ci` i båda delprojekten). Behåll även utvecklingsberoenden på byggservern eftersom TypeScript och Vite behövs under bygget.

Skapa `Backend/.env` från `Backend/.env.example` och fyll i databas, JWT-hemlighet och e-postinställningar. För test på backendens port:

```dotenv
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

`FRONTEND_URL` används även för e-postlänkar och CSRF-kontroll, så den ska motsvara adressen där appen öppnas. Återställ den till `http://localhost:5173` när ni använder Vites dev-server igen.

```bash
npm run build
npm start
```

Stäng Vites dev-server och öppna `http://localhost:3000`. Kontrollera startsidan, ett API-anrop i Network-fliken och en direktlänk till exempelvis `/filmer` eller `/salonger`. Ladda om undersidan. API och frontend ska ha samma origin.

Med servern igång kan ni även köra `npm run smoke` i en annan terminal. Det kontrollerar HTML, direktlänkar, byggda filer, API, 404-svar och lokala salongsbilder. För en annan port/domän: `npm run smoke -- https://your-domain.se`. Webbläsarens visuella kontroll och inloggnings-/mejlflöden behöver fortfarande göras manuellt.

Rotens bygge typkontrollerar och bygger både backend och frontend. Det summerar alla `.js`- och `.css`-filer i frontendbygget med gzip och stoppar bygget vid 500 kB. Bilder och typsnitt ingår inte i budgeten. CI kontrollerar också budgeten. `dist/` är Git-ignorerad och skapas om efter kodändringar.

API-routes och API-404 ligger före statiska filer och Express 5-fallbacken `/{*splat}`. Saknade filer i `/assets` och `/uploads` ger 404. HTML återvalideras; hashade Vite-filer kan cachas ett år. Den externa startfilen `/theme-init.js` återställer språk/tema före stilmallarna utan att kräva inline-JavaScript i CSP. CSP tillåter projektets Google Fonts och YouTube-spelare.

## Del 2: visningar och bilder

### Automatisk påfyllning

I produktion körs visningspåfyllningen vid serverstart och var tionde minut. I utveckling/test är den avstängd tills `SCREENINGS_REFILL_ENABLED=true` anges. `SCREENINGS_REFILL_ENABLED=false` stänger av den även i produktion.

Jobbet fyller luckor under `SCREENINGS_REFILL_DAYS` kalenderdagar (standard 21, inklusive idag), kl. 12, 16 och 20 i `TIMEZONE` (standard Europe/Stockholm). Det använder filmer som har premiär senast på visningsdagen eller saknar premiärdatum, och salonger med registrerade platser. Filmvalet roterar mellan filmerna. Salonger utan platser och tom filmkatalog lämnas orörda. Manuella visningar, bokningar och befintliga tider bevaras. En tom databas behöver alltså först riktiga filmer, salonger, platser och prisgrupper via administratören/databasinstallationen.

```bash
npm run refill:screenings
```

Kommandot använder den byggda funktionen `Backend/dist/scripts/add-screenings.js` och kräver ett backendbygge. Upprepade körningar fyller bara fria tider. Databaslås skyddar mot samtidiga CLI-/serverprocesser, salongslås samordnar med admin och överlappskontroll tar hänsyn till filmens längd och `SCREENING_BUFFER_MINUTES`. En boolean hindrar överlappande intervalljobb; fel fångas och nästa intervall försöker igen. Jobbet flyttar eller raderar inga visningar och kör ingen seedning.

### Lokala WebP-bilder

Salongernas två bilder ligger redan i `Frontend/public/images`, skalade till 800 px och konverterade till WebP. De följer med frontendbygget och Git. Källor finns i `Frontend/public/images/SOURCES.md`.

Filmaffischer, bakgrunder, personbilder och kioskbilder ligger i databasen. Kör först en förhandskontroll mot den databas ni avser att driftsätta:

```bash
npm run media:localize -- --dry-run
```

För att hämta bilderna och uppdatera adresserna:

```bash
npm run media:localize
```

Skriptet hämtar endast HTTPS-bilder från projektets befintliga bildvärdar: TMDB, Wikimedia, Unsplash och YouTube-bildservern. Det följer inga omdirigeringar och begränsar hämtningstid, filstorlek och pixelantal. Sharp skalar utan förstoring, konverterar till WebP och sparar i `Backend/uploads`. Maxbredd är 600 px för affischer/kiosk, 1600 px för bakgrunder och 400 px för personer. Samma källa/storlek återanvänder samma fil.

Databasadressen ändras till `/uploads/media-….webp` först efter en lyckad konvertering och bara om ingen annan hunnit redigera originaladressen. Misslyckade bilder behåller sina adresser och rapporteras med postens id. Kommandot avslutas med felstatus om någon bild misslyckades. Sådana bilder måste kontrolleras och laddas upp manuellt. HTTP-adresser och andra bildvärdar måste hanteras manuellt. **Alla externa bilder är inte flyttade förrän förhandskontrollen visar noll och ni har kontrollerat bilderna i appen.**

Bildflytten körs uttryckligen mot vald databas, aldrig automatiskt vid serverstart. Kör den igen efter TMDB-import eller andra ändringar som lagt till externa bildadresser. Ladda helst upp färdigoptimerade bilder via admin framöver. Trailers fortsätter använda befintliga YouTube-länkar; kontrollera att filmerna kommer från officiella källor.

`Backend/uploads` innehåller beständiga runtimefiler och är Git-ignorerad. Kopiera mappen separat om bildflytten görs på en annan dator än VPS:en. Bevara den vid uppdateringar och säkerhetskopiera den tillsammans med databasen.

### Domän och server

Teamet väljer domän och skickar önskemålet till Thomas via Omniway. Thomas ordnar enligt kursinformationen domän, DNS, VPS, brandvägg, Node/npm, pm2 och Caddy. Ingen domän är registrerad eller server publicerad genom kodändringarna här.

`deploy/Caddyfile.example` innehåller en mall. Ersätt `your-domain.se` och stäm av Node-porten med Thomas. `ecosystem.config.cjs` startar den byggda backendfilen direkt från `Backend/`, med en process och `NODE_ENV=production`.

På VPS:en behöver `Backend/.env` bland annat innehålla:

```dotenv
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.se
CORS_ORIGIN=https://your-domain.se
TRUST_PROXY=loopback
SCREENINGS_REFILL_DAYS=21
```

Byt platshållaren till den registrerade domänen. `TRUST_PROXY=loopback` gäller när Caddy kör på samma VPS och kontaktar Node på loopback-adressen. CORS behöver inga extra domäner för samma origin; CSRF-skyddets origin måste fortfarande stämma. Fyll i riktiga databas- och SMTP-värden samt en privat `JWT_SECRET`. Databasen måste ha aktuell SQL-struktur. För en befintlig databas körs projektets additiva migreringar före start:

```bash
npm run setup
npm run migrate:auth --prefix Backend
npm run migrate:bookings --prefix Backend
npm run migrate:cast --prefix Backend
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

Migreringarna ovan använder `tsx`, så kör dem innan ni eventuellt tar bort utvecklingsberoenden. För en ny databas installerar ni först `Backend/sql/01_schema.sql`, `02_views.sql` och `03_security.sql` med rätt databasroll. Kör inte projektets fulla `seed` på en databas som innehåller bokningar: den tömmer data. Produktionsservern avbryter start om databasen inte kan nås eller frontendbygget saknas.

Be Thomas verifiera pm2:s autostart vid omstart av VPS:en och aktivera rätt Caddy-konfiguration. Följ sedan dessa kontroller tillsammans:

- Öppna HTTPS-domänen och kontrollera certifikatet.
- Kontrollera filmer, bilder och API-anrop på samma origin.
- Öppna en undersida direkt och ladda om den.
- Testa inloggning och utloggning: produktionssessioner använder Secure-cookies.
- Testa verifierings-/bokningsmejl via riktig SMTP och att länkarna pekar på domänen.
- Kontrollera kommande visningar och `pm2 logs filmvisarna` för påfyllningsfel.
- Kontrollera att okända `/api`-adresser ger JSON med 404.

### Uppdateringar efter go-live

Kontrollera aktuell branch tillsammans med teamet. Ersätt `<deploy-branch>` med den överenskomna branchen:

```bash
git switch <deploy-branch>
git pull --ff-only
npm run setup
npm run build
pm2 restart ecosystem.config.cjs --update-env
pm2 status
pm2 logs filmvisarna --lines 50
```

Kör eventuella nya additiva migreringar enligt ändringens instruktioner före omstart. Bygg klart innan omstart. Radera aldrig `Backend/.env` eller `Backend/uploads` vid uppdatering. Skriv upp SSH-inloggning, driftsättningsbranch, repo-sökväg, databashantering och backup-rutin så att minst två personer kan uppdatera sajten.

Referenser: [Express 5-routning](https://expressjs.com/en/guide/migrating-5/), [Sharp resize](https://sharp.pixelplumbing.com/api-resize/), [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/), [Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
