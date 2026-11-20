> Tillbaka till [DESIGN.md](../../DESIGN.md) · [Tokens](../tokens.md) · [Komponenter](../components.md)

# Backoffice – översikt (`/admin`, FE-39)

`Frontend/src/pages/admin/AdminDashboard.tsx` är ingången till personalens arbete. Sidan använder det gemensamma adminskalet med toppnavigering, sidfot och mobilens `BottomNav`. Den egna stilen finns i `styles/components/admin/_admin-dashboard.scss`.

## Sidhuvud och navigering

Hero med rödtonad eyebrow `BACKOFFICE · FILMVISARNA SMÅSTAD`, Poppins-rubrik, välkomsttext och dagens datum i `Europe/Stockholm`. `sv-SE` respektive `en-GB` följer valt språk. Snabbknappar öppnar Visningsschema och Filmarkiv.

Fyra modulkort öppnar Bokningar & Kassa, Visningsschema, Filmarkiv och Salonger. Varje kort har en semantisk accent, 44 × 44 px ikonruta, aktuell databaserad status och en CTA med ett modulspecifikt tillgängligt namn. Hover lyfter kortet 3 px; reducerad rörelse tar bort övergång och lyft.

## Live-data och nyckeltal

`useScreenings(undefined, 'dashboard')`, `useMovies()` och `useCinemas()` laddar oberoende av varandra. Uppgifterna uppdateras varje minut när fliken är synlig och när fönstret återfår fokus. Beräkningarna finns i `utils/adminDashboard.ts`.

| Nyckeltal | Definition | Accent |
| :--- | :--- | :--- |
| Dagens visningar | Alla visningar med startdatum idag i Stockholm, inklusive redan startade, samt deras bokade platser. | Information/blå |
| Kommande visningar | Visningar vars starttid ligger i framtiden samt antalet unika programdagar. | Primär/biografröd |
| Filmarkiv | Antal filmer i katalogen samt antal katalogfilmer med pågående eller kommande visningar. | Framgång/grön |
| Salonger & kapacitet | Antal registrerade salonger och summan av deras faktiska stolskapacitet, normalt 2 salonger och 120 platser. | Varning/bärnsten |

`GET /api/screenings/dashboard` kräver adminsession och returnerar hela dagens och framtidens visningar. Publika visningsanrop behåller sin framtidsfiltrering. Bokade platser följer samma serverregel som övriga visningsanrop: aktiva biljetter i bekräftade bokningar, med obetalda platser släppta en timme före start. Ingen databasmigrering krävs.

## Operativ översikt

Två panelkolumner från 1024 px; en kolumn på mindre skärmar. Nyckeltalen har två kolumner på mobil och fyra från 1024 px. Modulkorten har en, två respektive fyra kolumner vid mobil, 640 px och 1024 px.

Körschemat visar upp till fem pågående eller närmast kommande visningar i tidsordning. Varje rad visar datum, start och slut i JetBrains Mono, filmtitel, `AuditoriumBadge`, 2D/3D samt bokade/totalantal platser. Ett native `progress`-element med klassen `.admin-table__bar` ger beläggningsstapeln utan inline-stil. Stapeln är grön upp till 80 procent och gul över 80 procent. Salongens format avgör 3D; projektoruppgifter som 4K betyder inte 3D.

Salongsstatus visar namn, verklig stolskapacitet och dagens antal visningar per salong. Standardnamnen Stora Salongen och Lilla Salongen översätts; eventuella egna salongsnamn behålls. Driftrutiner beskriver 20 min städtid, automatisk frigivning av obetalda reservationer 60 min före start och max 10 biljetter per bokning.

## Tillstånd, tema och verifiering

Första laddningen visar språkstyrd status och skeleton för nyckeltal och paneler. Vid API-fel ersätts statistiken av ett översatt felmeddelande med Försök igen; modullänkarna finns kvar. Retry laddar alla tre datakällor parallellt. Tomma svar ger nollor och särskilda tomlägen för körschema och salonger. Tidigare siffror visas inte som giltiga när någon datakälla rapporterat fel.

Alla UI-texter finns i `i18n/sv.ts` och `i18n/en.ts`. Färger använder semantiska tokens för båda teman. Primärrött används dekorativt; eyebrowtext använder kontrasttoken `$color-danger-soft`. `theme.test.ts` kontrollerar även textkontrast på herons sammansatta tonade ytor.

Verifiera med `npm test`, `npm run lint` och `npm run build` i `Frontend/`. Backendens `dashboard.integration.test.ts` verifierar adminskydd, hela dagens data, frigivna obetalda platser och oförändrad publik framtidsfiltrering med en separat testdatabas via `AUTH_TEST_DATABASE_URL`. Visuell granskning bör omfatta 390 px och 1280 px i båda teman och språk, tangentbordsfokus samt reducerad rörelse.
