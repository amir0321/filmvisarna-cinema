> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips, 3.3 Badges), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.3 Filmdetaljer (`MovieDetails.tsx`)

- **Route:** `/filmer/:id`, med alias `/movies/:id`.
- **Aktuell implementation:** `Frontend/src/pages/MovieDetails.tsx`, `Frontend/src/components/{Poster,Modal,TrailerModal}.tsx` och `Frontend/src/styles/components/_movie-details.scss`.
- Data hämtas via film- och visnings-API. Beskrivningen gäller appens nuvarande layout; prototypens exempeldata är endast referens.

#### Struktur uppifrån och ned
1. **Backdrop & Trailer Hero (`height: 320px` på mobil `h-80`, `384px` på `>= 640px` `sm:h-96`):**
   - Bakgrundsbild från `movie.landscape_image_url`, med affisch som alternativ vid bildfel, och gradient mot sidans mörka bakgrund.
   - Centrerad rund play-knapp (`64×64px`, `.glass`, `border: 2px solid rgba(255, 255, 255, 0.4)`, skalar `1.10` vid hover; öppnar `TrailerModal` för filmen). `TrailerModal` öppnas även automatiskt om sidan besöks med query-parametern `?trailer=1` (från `"Se Trailer"` i startsidans hero).
   - **Tillbaka-knapp** uppe till vänster (`top: 24px`, `left: 16px`, `32px` från `640px`): glasyta med vänsterchevron och texten `Tillbaka`, länk till `/filmer`.
2. **Huvudinnehåll (`max-width: 1152px`, överlappar hero med `-mt-16` / `-64px`, `z-index: 10`):**
   - **Grid:** En kolumn under `768px`, där titelblocket kommer före affisch/fakta och sedan synopsis/medverkande/schema. Från `768px` finns två kolumner: `240–300px` för affisch/fakta och en flexibel högerkolumn för titel och innehåll. Horisontellt gap `32px`.
   - **Vänster kolumn:**
     - **Filmposter:** `aspect-[2/3]`, `max-width: 320px` (`max-w-xs`), `border-radius: 16px`, `shadow-2xl`.
     - **Faktaruta (`#161F30`, `border-radius: 16px`, `padding: 20px`):**
       - Rubrik: `Fakta` (`14px`, `uppercase`, `#94A3B8`).
       - Nyckel–värde-rader (`padding: 8px 0`, `border-bottom: 1px solid var(--border)`):
         - `Åldersgräns`: `Alla åldrar` (om `'Alla'`) eller `{ageRating} år`
         - `Premiärår`: året från `release_date`, annars `Ej angiven`
         - `Speltid`: filmens faktiska längd formaterad i timmar/minuter
         - `Originaltitel`: visar för närvarande filmens lagrade titel; modellen lagrar ingen separat originaltitel
         - `IMDb`: betyg när `imdb_rating` finns; vid TMDB-import innehåller det fältet TMDB:s publikbetyg
   - **Höger kolumn:**
     - **Titelblock:** Genre-pills (`uppercase`), filmtitel (`h1`, `36px` mobil / `48px` desktop, `Poppins`), samt texten `Regi: {movie.director}` (`14px`, `#94A3B8`).
     - **Synopsis:** Brödtext (`16px`, `rgba(240, 242, 247, 0.8)`).
     - **Medverkande:** Klickbara profilkort enligt avsnittet nedan.
     - **Visningsschema-kort (`#161F30`, `border-radius: 16px`, `padding: 24px`):**
       - **Datumrad:** Dynamiska chips för datum med filmvisningar, formaterade på svenska. Ett valt datum filtrerar visningarna och markeras aktivt; om inget val finns används första tillgängliga datum.
       - **Salongssektioner:** Grupperade efter `Stora Salongen` och `Lilla Salongen` (sektioner utan visningar för filmen döljs).
       - **Visningsrad (`padding: 12px`, `border-radius: 12px`, `background: rgba(255, 255, 255, 0.04)`, `border: 1px solid rgba(255, 255, 255, 0.07)`):**
         - Vänster: Starttid (`{time}`, `16px`, `font-weight: 600`), sluttid (`–{endTime}`, `12px`, `#94A3B8`), formatbadge (`{format}`, t.ex. `2D`).
         - Höger: verkligt antal lediga platser, röd återkoppling vid färre än 15 eller texten `Fullbokad`, samt `Välj platser` som länkar till `/boka/:visningId`. Bokningssidan hanterar fullbokat utan biljett- eller platsval.
       - Laddning, hämtningsfel med återförsök och avsaknad av kommande visningar har separata svenska tillstånd.

#### Klickbara skådespelarprofiler

- Sektionen `Medverkande` använder `cast_members` i billing-ordning. Äldre filmer med bara `actors` får samma klickbara kort med namn och reservikon.
- `.movie-details-cast__list` radbryter korten. Varje kort är en riktig knapp med namn som tillgänglig etikett, rund `48×48px` profilbild, namn och eventuell rollfigur.
- Bilder laddas med `loading="lazy"` endast för säkra HTTP(S)- eller `/uploads/`-URL:er. Saknad, osäker eller trasig bild ger `bi-person-fill`; en misslyckad URL försöks inte igen i profilmodalen.
- Hover använder projektets sekundäryta och röda kant. Tangentbordsfokus har `outline: 2px solid $fv-primary` och `outline-offset: 2px`. Rörelseövergångar stängs av vid `prefers-reduced-motion`.
- Klick öppnar samma `Modal`/`Modal.Body` som sidfotens informationsdialoger: skådespelarens namn i dialoghuvudet, rund `96×96px` profilbild eller ikon, `Roll i {filmtitel}: {rollfigur}` när rollfigur finns, och biografin som vanlig text i ett `<p>`-element. Radbrytningar bevaras och långa ord kan brytas.
- Saknad biografi visar `Ingen biografi tillgänglig för denna skådespelare.` Dialogen använder mörka `$fv-*`-tokens och BottomSheet på mobil. Kryss, Escape och bakgrundsklick stänger; fokus hålls i dialogen och återgår till öppningsknappen.
- Byte till en annan filmsida stänger den valda profilen och återställer listan över trasiga profilbilder.

