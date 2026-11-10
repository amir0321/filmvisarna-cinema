> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips & Visnings-pills, 3.3 Badges, 3.4 Filmkort & UpcomingCard, 3.6 Formulär, 3.7 Modaler, 3.8 Tabbar), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.2 Filmer & Repertoar (`FilmerScreen`)

- **Route:** `/filmer`
- **Skärm-ID:** `'filmer'`
- **Källfiler:** `Frontend/src/pages/Movies.tsx`, `Frontend/src/components/movies/{MovieFilters,MovieListCard}.tsx`.

#### Struktur uppifrån och ned
1. **Sidhuvud / Hero-remsa (`background: linear-gradient(to bottom, rgba(22, 31, 48, 0.9), var(--background))`, `border-bottom: 1px solid var(--border)`):**
   - Container (`max-width: 1280px`, `padding-top: 32px` under `80px` topp-padding):
     - **Rubrik (`h1`):** `Filmer & Repertoar` (`clamp(24px, 4vw, 38px)`, `font-weight: 800`, `Poppins`).
     - **Underrubrik:** `Vad vill du se? Vi spelar nu {MOVIES.length} filmer på FILMVISARNA.` (med exempeldata: `Vad vill du se? Vi spelar nu 8 filmer på FILMVISARNA.`).
     - **Flikar:**
       1. `På bio nu` (`id: 'bio'`)
       2. `Kommande premiärer` (`id: 'kommande'`) med gul badge `4` (`UPCOMING_MOVIES.length`, `#F59E0B`).
2. **Flik 1: `På bio nu` (`activeTab === 'bio'`):**
   - **Klibbig filterpanel (`position: sticky`, `top: 64px`, `z-index: 40`, `background: rgba(11, 15, 25, 0.92)`, `backdrop-filter: blur(10px)`):**
     - **Rad 1 (Sök + Sortering):**
       - Datum (`?date=ÅÅÅÅ-MM-DD`) och åldersgräns (`?age=0|7|11|15`) läses från URL:en och bevaras vid omladdning och bakåt/framåt. Datum kan väljas från idag till 60 dagar framåt; ogiltiga värden ger idag/alla.
       - Sökfält med ikon och placeholder: `Sök film eller genre...`
       - Toppnavigeringens `Sök filmer` navigerar till `/filmer?sok=1`. När `sok=1` finns fokuseras sökfältet utan automatisk fokusskroll och skrollas sedan mjukt till mitten av vyn (direkt vid reducerad rörelse). Endast `sok` tas bort med `replace: true`; övriga parametrar bevaras. Fungerar även vid nytt klick när användaren redan är på `/filmer`.
       - Sorterings-dropdown (`<select>`) med alternativen: `Mest populär`, `Högst betyg`, `Nyast`, `A–Ö`.
     - **Rad 2 (Genre-chips, horisontellt scrollbar):** `Alla`, `Action`, `Animation`, `Drama`, `Fantasy`, `Krim`, `Romance`, `Sci-Fi`, `Thriller`, `Western`.
     - **Rad 3 (Ålders-chips, horisontellt scrollbar):** Etikett `Åldersgräns:` följt av `Alla`, `Barntillåten`, `7 år`, `11 år`, `15 år`.
     - **Rad 4 (Datum):** Behåll de fyra närmaste dagarnas datumchips och visa samma kalenderknapp och `DatePickerPopover` som på startsidan. Kalendern tillåter idag till 60 dagar framåt. Ett valt datum utanför chipsen visas på kalenderknappen, som markeras aktiv. Datumval stänger kalendern och återför fokus till knappen; Escape och klick utanför stänger också kalendern.
   - **Resultatrad:**
     - Text till vänster: `Visar {filteredMovies.length} av {MOVIES.length} filmer` (antalet i `<strong>`).
     - Länkknapp till höger (visas endast om `activeGenre !== 'Alla' || activeAge !== 'Alla' || search`): `Rensa filter` (`#E50914`).
   - **Filmgrid:** 1 kolumn på mobil, därefter 2/3/4 kolumner och 5 på bred desktop. Renderar `MovieListCard`. `Poster` provar landskapsbilden om affischen saknas eller inte går att ladda, därefter en reservyta med filmtiteln.
   - **Sidnumrering (båda flikarna):** `Movies.tsx` använder `usePagination(filteredMovies, 10)` efter filtrering och sortering: högst 10 filmer per sida (2 rader × 5 kolumner på bred desktop). `Pagination` placeras under griden och döljs när högst 10 filmer matchar. Byte av flik, sökning, genre, åldersfilter, datum, sortering eller rensning återställer sida 1. Resultatantalet avser hela den filtrerade listan. Utseende och mobilvy enligt [§3.13](../components.md#313-sidnumrering-paginationtsx).
   - **Tomt tillstånd (`filteredMovies.length === 0`):**
     - Emoji `🔍` (`40px`), text `Inga filmer matchar din sökning.` och röd länkknapp `Visa alla filmer`.
3. **Flik 2: `Kommande premiärer`:**
   - Filmer med framtida `release_date` visas i samma responsiva `MovieListCard`-grid, med 10 filmer per sida. Genre-, ålders-, sök- och sorteringsfilter gäller även här; datumchips döljs.
   - Kortet visar affisch, speltid, åldersgräns, IMDb-betyg, genre, premiärdatum och `Läs mer` till `/filmer/:id`. Ingen påminnelsefunktion visas eftersom appen saknar backend för den.
4. **Navigering och tillgänglighet:**
   - `På bio nu` behåller sin etikett och visar utgivna filmer med återstående visningar vald dag. Att en film saknas en viss dag betyder inte att affischen saknas.
   - Biljettknappen går till filmens detaljsida; fullbokade visningstider har en icke-klickbar `Fullbokad`-etikett.
   - Trailern öppnas på detaljsidan via `/filmer/:id?trailer=1`, inte i en separat trailer-modal på listvyn.
   - Resultatantal avser hela den filtrerade listan; paginering döljs för högst tio träffar. Med bara två salonger kan ett enskilt dagsprogram korrekt rymmas på en sida.
