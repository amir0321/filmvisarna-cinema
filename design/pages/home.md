> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips & Visnings-pills, 3.3 Badges, 3.4 Filmkort, 3.12 Cookie-banner), [design/layout.md](../layout.md) (4.1 App, 4.2 Nav, 4.4 BottomNav, 4.5 MobileDrawer, 4.6 Sidfot) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.1 Startsida (`HomeScreen`)

- **Föreslagen route:** `/` (Föreslagen)
- **Skärm-ID:** `'home'`
- **Källfiler:** `src/components/HomeScreen.tsx`, `src/data.ts`, `src/imports/pasted_text/filmvisarna-booking-spec.md`, `src/imports/pasted_text/cinema-app-screens.md`

#### Struktur uppifrån och ned
1. **Hero-sektion (`height: 75vh`, `min-height: 500px`, `max-height: 720px`):**
   - Fullbredds bakgrundsbild (`HERO_MOVIE.backdrop`, Exempeldata: *Stjärnornas Krig: Arvet*).
   - Två överlagrade gradienter:
     - Nedifrån och upp: `linear-gradient(to top, #0B0F19 0%, rgba(11, 15, 25, 0.55) 55%, transparent 100%)` *(Spec anger `0.4` vid `60%`)*.
     - Från vänster: `linear-gradient(to right, rgba(11, 15, 25, 0.7) 0%, transparent 40%)`.
   - Innehållsblock nere till vänster (`max-width: 768px`, `padding: 80px 16px 32px` mobil, `sm:px-8`, `lg:px-16`):
     - **Taggrad:** Genre-pills (`Sci-Fi`, `Äventyr` — Exempeldata), röd åldersbadge (`{ageRating} år`, t.ex. `15 år` — Exempeldata), speltid (`2h 45m` — Exempeldata).
     - **Huvudrubrik (`h1`):** Filmtitel (`Stjärnornas Krig: Arvet` — Exempeldata).
     - **Ingress:** De första 140 tecknen av filmens synopsis följt av `…` (`rgba(240, 242, 247, 0.7)`).
     - **Knapprad:**
       - `Se Trailer` (sekundär `.glass`-knapp med play-ikon, ingen klick-handler).
       - `Boka Biljett` (primär röd knapp med högerchevron, anropar `onSelectMovie(HERO_MOVIE)`).
2. **Klibbig filterrad (`position: sticky`, `top: 64px`, `z-index: 40`, klass `.glass`, `border-bottom: 1px solid rgba(255, 255, 255, 0.07)`):**
   - Container (`max-width: 1280px`, `padding: 12px 16px`), staplad på mobil (`flex-col`), rad på `>= 640px` (`sm:flex-row`).
   - **Datumgrupp:** Etikett `Datum` (`12px`, `uppercase`, `#94A3B8`) + filterchips från `DATE_FILTERS`: `Idag`, `Imorgon`, `I helgen` *(Spec nämner även `"Helgen"`)* + en knapp med kalenderikon (`14×14px`, `.chip-inactive`, ingen klick-handler).
   - **Vertikal avdelare (`hidden sm:block`):** `width: 1px`, `background: rgba(255, 255, 255, 0.08)`.
   - **Åldersgrupp:** Etikett `Åldersgräns` (`12px`, `uppercase`, `#94A3B8`) + filterchips från `AGE_FILTERS`: `Alla`, `Barntillåten`, `7 år`, `11 år`, `15 år`.
3. **Repertoarsektion (`max-width: 1280px`, `padding: 40px 16px`):**
   - **Rubrik (`h2`):** `Repertoar — {activeDate}` (t.ex. `Repertoar — Idag`, `24px`, `Poppins`, `font-weight: 600`).
   - **Filmgrid:** `grid-cols-1` (`< 640px`), `sm:grid-cols-2` (`>= 640px`), `lg:grid-cols-3` (`>= 1024px`), `xl:grid-cols-4` (`>= 1280px`), `gap: 24px`.
   - **Filmkort:** Visar affisch, åldersbadge (`Alla` i grönt `#10B981`, övriga `{ageRating} år` i rött `#E50914`), filmtitel, `{runtime} · {director}`, genre-pills samt upp till 3 klickbara visnings-pills (`{time} · Stora` eller `{time} · Lilla`, plus `({seatsLeft} kvar)` i rött om `seatsLeft < 10`).
4. **Sidfot (`Footer`):** Se sektion 4.6.

#### Tillstånd och Interaktioner
- **Standardtillstånd:** `activeDate = 'Idag'`, `activeAge = 'Alla'`.
- **Filtrering:**
  - `activeAge` filtrerar `MOVIES`: `'Alla'` visar alla; `'Barntillåten'` matchar `m.ageRating === 'Alla'`; övriga matchar `m.ageRating === activeAge.replace(' år', '')`.
  - `activeDate` ändrar rubriken `Repertoar — {activeDate}` men filtrerar inte bort filmer i prototypens mockdata.
- **Tomt tillstånd (`filteredMovies.length === 0`, t.ex. vid val av `7 år` i prototypens exempeldata):**
  - Centrerad text (`padding: 96px 0`, `#94A3B8`): `Inga filmer matchar det valda filtret.`
- **Klick på filmkort eller `Boka Biljett`:** Anropar `handleSelectMovie(movie)` i `App.tsx`, nollställer valda biljetter/platser och byter skärm till `'detail'`.
- **Klick på visnings-pill (`e.stopPropagation()`):** Anropar `handleSelectScreening(movie, s)` i `App.tsx` och går direkt till `'seats'` (stolsväljaren).

