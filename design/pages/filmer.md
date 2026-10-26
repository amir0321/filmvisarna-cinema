> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips & Visnings-pills, 3.3 Badges, 3.4 Filmkort & UpcomingCard, 3.6 Formulär, 3.7 Modaler, 3.8 Tabbar), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.2 Filmer & Repertoar (`FilmerScreen`)

- **Föreslagen route:** `/filmer` (Föreslagen)
- **Skärm-ID:** `'filmer'`
- **Källfiler:** `src/components/FilmerScreen.tsx`, `src/data.ts`

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
       - Sökfält med ikon och placeholder: `Sök film eller genre...`
       - Sorterings-dropdown (`<select>`) med alternativen: `Mest populär`, `Högst betyg`, `Nyast`, `A–Ö`.
     - **Rad 2 (Genre-chips, horisontellt scrollbar):** `Alla`, `Action`, `Animation`, `Drama`, `Fantasy`, `Krim`, `Romance`, `Sci-Fi`, `Thriller`, `Western`.
     - **Rad 3 (Ålders-chips, horisontellt scrollbar):** Etikett `Åldersgräns:` följt av `Alla`, `Barntillåten`, `7 år`, `11 år`, `15 år`.
   - **Resultatrad:**
     - Text till vänster: `Visar {filteredMovies.length} av {MOVIES.length} filmer` (antalet i `<strong>`).
     - Länkknapp till höger (visas endast om `activeGenre !== 'Alla' || activeAge !== 'Alla' || search`): `Rensa filter` (`#E50914`).
   - **Filmgrid:** `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`, `gap: 20px`. Renderar `MovieCard` med knapp `Köp biljetter`.
   - **Tomt tillstånd (`filteredMovies.length === 0`):**
     - Emoji `🔍` (`40px`), text `Inga filmer matchar din sökning.` och röd länkknapp `Visa alla filmer`.
3. **Flik 2: `Kommande premiärer` (`activeTab === 'kommande'`):**
   - **Ingress:** `Kommande premiärer på FILMVISARNA hösten 2026. Bli påmind när biljetterna släpps.`
   - **Kortlista (`flex-direction: column`, `gap: 16px`):** Renderar `UpcomingCard` för varje film i `UPCOMING_MOVIES` (Exempeldata: 4 kommande filmer).
   - **Kortinnehåll (`UpcomingCard`):**
     - Vänster: Poster med banderoll `PREMIÄR {PREMIEREDATE}` (t.ex. `PREMIÄR 24 OKTOBER 2026` — Exempeldata).
     - Höger: IMDb-betyg (`{rating} IMDb`), titel, `{originalTitle} · {runtime} · Regi: {director}`, genre-taggar, ålders-tagg (`Alla åldrar` eller `{ageRating}+`), trunkerad synopsis (160 tecken + `…`), upp till 3 skådespelar-pills samt knapparna:
       - `Se Trailer` (öppnar `TrailerModal`)
       - `Bli påmind vid biljettsläpp` (växlar lokalt state `reminded` till `Påminnelse aktiv` i grönt `#10B981`).
4. **Trailer-modal (`TrailerModal`, visas när `trailerMovie !== null`):**
   - 16:9 videospelar-mock med mörktonad backdrop-bild, rund röd play-knapp (`72×72px`), text `Trailer — {movie.title}` och stäng-kryss uppe till höger.
   - Nedre del (`padding: 24px`): Filmtitel, IMDb-betyg, genre-taggar, speltid, fullständig synopsis samt knapparna:
     - `Gå till visningstider & boka` (primär röd knapp, stänger modalen och navigerar till `home`).
     - `Stäng` (sekundär outline-knapp, stänger modalen).

