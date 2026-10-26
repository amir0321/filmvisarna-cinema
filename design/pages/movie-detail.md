> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips, 3.3 Badges), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.3 Filmdetaljer (`MovieDetailScreen`)

- **Föreslagen route:** `/filmer/:id` (Föreslagen)
- **Skärm-ID:** `'detail'`
- **Källfiler:** `src/components/MovieDetailScreen.tsx`, `src/data.ts`, `src/imports/pasted_text/filmvisarna-booking-spec.md`, `src/imports/pasted_text/cinema-app-screens.md`

#### Struktur uppifrån och ned
1. **Backdrop & Trailer Hero (`height: 320px` på mobil `h-80`, `384px` på `>= 640px` `sm:h-96`):**
   - Bakgrundsbild (`movie.backdrop`) med gradient `linear-gradient(to top, #0B0F19 0%, rgba(11, 15, 25, 0.5) 60%, transparent 100%)`.
   - Centrerad rund play-knapp (`64×64px`, `.glass`, `border: 2px solid rgba(255, 255, 255, 0.4)`, skalar `1.10` vid hover; `onClick` är en tom funktion i prototypen).
   - **Tillbaka-knapp** uppe till vänster (`top: 80px`, `left: 16px` / `sm:left-8`): `.glass`-knapp med vänsterchevron och texten `Tillbaka` (navigerar i `App.tsx` tillbaka till `'filmer'`).
2. **Huvudinnehåll (`max-width: 1152px`, överlappar hero med `-mt-16` / `-64px`, `z-index: 10`):**
   - **Grid:** 1 kolumn på `< 1024px`, 3 kolumner på `>= 1024px` (`lg:grid-cols-3`, `gap: 32px`).
   - **Vänster kolumn (`lg:col-span-1`):**
     - **Filmposter:** `aspect-[2/3]`, `max-width: 320px` (`max-w-xs`), `border-radius: 16px`, `shadow-2xl`.
     - **Faktaruta (`#161F30`, `border-radius: 16px`, `padding: 20px`):**
       - Rubrik: `Fakta` (`14px`, `uppercase`, `#94A3B8`).
       - Nyckel–värde-rader (`padding: 8px 0`, `border-bottom: 1px solid var(--border)`):
         - `Åldersgräns`: `Alla åldrar` (om `'Alla'`) eller `{ageRating} år`
         - `Premiärår`: `{year}` (Exempeldata: `2026`)
         - `Speltid`: `{runtime}`
         - `Originaltitel`: `{originalTitle}`
         - `Språk`: `{language}`
         - `Undertexter`: `{subtitles}` (raden döljs om `movie.subtitles` är tom sträng, t.ex. för *Lille Björnens Stora Äventyr*).
   - **Höger kolumn (`lg:col-span-2`):**
     - **Titelblock:** Genre-pills (`uppercase`), filmtitel (`h1`, `36px` mobil / `48px` desktop, `Poppins`), samt texten `Regi: {movie.director}` (`14px`, `#94A3B8`).
     - **Synopsis:** Brödtext (`16px`, `rgba(240, 242, 247, 0.8)`).
     - **Medverkande:** Rubrik `Medverkande` (`14px`, `uppercase`, `#94A3B8`) följt av runda skådespelar-pills (`movie.cast`).
     - **Visningsschema-kort (`#161F30`, `border-radius: 16px`, `padding: 24px`):**
       - **Datumrad:** 4 chips (`Idag`, `Imorgon`, `Lördag`, `Söndag`). I prototypen är `Idag` (`i === 0`) statiskt satt som `.chip-active` och övriga som `.chip-inactive`.
       - **Salongssektioner:** Grupperade efter `Stora Salongen` och `Lilla Salongen` (sektioner utan visningar för filmen döljs).
       - **Visningsrad (`padding: 12px`, `border-radius: 12px`, `background: rgba(255, 255, 255, 0.04)`, `border: 1px solid rgba(255, 255, 255, 0.07)`):**
         - Vänster: Starttid (`{time}`, `16px`, `font-weight: 600`), sluttid (`–{endTime}`, `12px`, `#94A3B8`), formatbadge (`{format}`, t.ex. `2D`).
         - Höger: `{seatsLeft} platser kvar` (`12px`, färg `#ff6b6b` om `seatsLeft < 15`, annars `#94A3B8`) + primär knapp `Välj platser` (anropar `onSelectScreening(movie, s)` och byter skärm till `'seats'`).

