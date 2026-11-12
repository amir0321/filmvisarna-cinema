> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Åldersbadges, 3.5 Tabeller, 3.6 Formulär, 3.7 Modaler & BottomSheets, 3.8 Admin-flikar, 3.9 Inline-feedback), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.12 Admin – Filmarkiv (`AdminMovies.tsx`)

- **Route:** `/admin/filmer`, med alias `/admin/movies`. Kräver administratör.
- **Aktuell implementation:** `Frontend/src/pages/admin/AdminMovies.tsx`, `Frontend/src/components/admin/{AdminPageHeader,MoviesTable,MovieFormModal,CastMemberEditor}.tsx` och `Frontend/src/styles/components/admin/_admin-movies.scss`.
- Beskrivningen gäller den implementerade appen och ersätter prototypens `FilmarkivTab`.

#### Gemensamt sidhuvud och navigering

- `AdminPageHeader` visar rubriken `Filmarkiv` och underrubriken `Lägg till filmer, granska filmuppgifter och hantera rollistor.`
- Från `768px` ligger brödsmulan `Backoffice › Filmarkiv` uppe till höger. Vänsterkolumnen kan krympa och underrubriken radbrytas. På mobil ligger brödsmulan under rubrikblocket.
- `Backoffice` länkar till administrationsöversikten `/admin`. `Filmarkiv` är aktuell sida med `aria-current="page"`. Samma komponent och beteende används i Visningsschema.
- Adminens desktopmeny och mobila sidomeny har även en separat `Backoffice`-länk. Se [layout §4.3](../layout.md#43-admin-navigering-samma-header-som-vanliga-hemsidan).

#### Verktygsrad och filmlista

- **Sökning:** `Sök efter filmtitel eller regissör`, filtrering på båda fälten utan hänsyn till skiftläge. Ändrat sökord återställer sida 1.
- **Återkoppling:** Dynamiskt `1 film` / `X filmer`, laddningsskelett, svenskt fel med `Försök igen` och ett tomt tillstånd med relevant åtgärd.
- **Primär knapp:** `Lägg till film` på alla skärmstorlekar.
- **Sidnumrering:** `usePagination` och `Pagination`, 10 filmer per sida efter filtrering.
- **Från `768px`:** Semantisk tabell med kolumnerna `Film`, `Ålder`, `Speltid`, `Regissör`, `Visningar`, `Åtgärder`. Tabellen ligger i en lokalt scrollbar behållare när den behöver mer bredd.
- **Under `768px`:** Staplade filmkort med samma uppgifter och åtgärder. Filmtitlar och genrer kan radbrytas.
- **Per film:** Affisch via `Poster` med reservyta, titel, genre-pills (`Badge variant="genre"`), åldersbadge (`AgeBadge variant="admin"`), formaterad speltid, regissör samt verkligt antal kommande och totala visningar.
- `Redigera` öppnar ett förifyllt formulär. `Ta bort` använder `InlineConfirmAction` med `Ja, ta bort` och `Avbryt`. Filmer med registrerade visningar, även tidigare visningar, har inaktiverad borttagning och en synlig svensk förklaring. Backendens konfliktfel visas också inline.

#### Filmformulär och TMDB-import

- `MovieFormModal` laddas när formuläret öppnas. Gemensam `Modal` med `size="lg"` ger centrerad dialog på desktop, högst `780px`, och BottomSheet under `768px`. Innehållet kan skrollas medan dialoghuvud och åtgärder ligger kvar.
- Rubrik `Lägg till film` eller `Redigera film`. Formulärfält: filmtitel, beskrivning, speltid i minuter, åldersgräns, regissör, betyg 0–10, premiärdatum, kommaseparerade genrer, affisch, bred bild-URL och trailer-URL. Formulärgriden blir en kolumn på mobil.
- TMDB-sökningen väntar `350 ms` och avbryter gamla anrop med `AbortController`. Förslag visar liten affisch, titel, utgivningsår och eventuell originaltitel. Val hämtar metadata och rollista till formuläret för granskning; inget sparas automatiskt. Originaltiteln är information från importen, inget separat lagrat formulärfält.
- Svenska laddnings-, tom- och felmeddelanden visas vid sökningen. Manuell inmatning fungerar även när TMDB saknar konfiguration eller är otillgängligt. Saknad speltid måste kompletteras före sparning. Importerat betyg anges som TMDB:s publikbetyg.
- Affisch kan väljas som fil med omedelbar förhandsvisning eller anges som bild-URL. JPG/JPEG, PNG, WebP och GIF tillåts upp till 5 MB. Klienten validerar typ/storlek och servern kontrollerar även filändelse och magic bytes. Osäkra URL:er avvisas med svensk återkoppling.
- Bild-URL:er tillåter `http://`, `https://` och `/uploads/`; trailer kräver HTTP(S). Credentials, för långa URL:er och sökvägstraversering i uppladdningslänkar avvisas.
- Sparning går via API. Grön `Sparad!` visas i dialogen och listan efter lyckat svar; dialogen är kvar för granskning och kan stängas med `Stäng`. Fortsatt redigering uppdaterar samma film. Fel behåller formulärets innehåll.

#### Rollista och gemensamma personprofiler

- `CastMemberEditor` söker i personregistret och återanvänder befintliga personer. Dubbletter stoppas med person-ID, TMDB-ID eller normaliserat namn.
- Lägg till manuellt eller redigera namn, profilbild via validerad fil/bild-URL och förhandsvisning, biografi samt rollfigur i filmen. TMDB-import kan fylla samma uppgifter.
- Profilen sparas uttryckligen i personregistret och delas mellan filmer. Ett öppet profilutkast måste sparas eller avbrytas före filmens sparning eller en ny import.
- Att ta bort en skådespelare ur rollistan tar bara bort filmkopplingen när filmen sparas. Personprofilen finns kvar och kan återanvändas.

