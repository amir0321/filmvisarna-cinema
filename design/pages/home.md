> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips & Visnings-pills, 3.3 Badges, 3.4 Filmkort, 3.12 Integritet och lokal lagring), [design/layout.md](../layout.md) (4.1 App, 4.2 Nav, 4.4 BottomNav, 4.5 MobileDrawer, 4.6 Sidfot) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.1 Startsida (`HomeScreen`)

- **Route:** `/`
- **Skärm-ID:** `'home'`
- **Källfiler:** `Frontend/src/pages/Home.tsx`, `Frontend/src/components/home/{HeroSection,FilterStrip,RepertoireSection,MovieCard}.tsx`.

#### Struktur uppifrån och ned
1. **Hero-sektion / Karusell (`min-height: max(520px, min(85vh, 720px))`, `HeroSection.tsx`):**
   - Visar upp till **5 utvalda filmer** (`HERO_MOVIE_COUNT = 5`, prioriterar filmer med `landscape_image_url`) i en tillgänglighetsanpassad karusell (`aria-roledescription="karusell"`, `aria-label="Utvalda filmer"`).
   - **Bakgrundsbild & bakgrundstrailer:**
     - Fullbredds bakgrundsbild (först `landscape_image_url`, sedan `poster_url` vid laddningsfel) per slide med mjuk övertoning (`opacity` `0.8s ease`).
     - Om filmen har `trailer_url` (och karusellen inte är pausad) spelas YouTube-trailern upp tyst och loopande i bakgrunden (`getYouTubeBackgroundUrl`, `youtube-nocookie.com/embed/...` med `autoplay=1&mute=1&loop=1&controls=0`), med `start=12`, `disablekb=1`, `iv_load_policy=3` och `fs=0`. Bakgrundsbilden ligger kvar medan YouTubes IFrame API laddas. `enablejsapi=1` och sidans `origin` aktiverar spelarhändelser. `createPlaybackVisibilityTracker` kräver att spelaren rapporterar `PLAYING` och att både videons tid och den verkliga tiden avancerat minst tre sekunder utan avbrott. Därefter tonas videon in under `0.8s`. Vid paus, buffring, avslut, bakåtsökning eller uppspelningsfel döljs den direkt (`transition: none` i dolt läge); ny uppspelning behöver samma uppvärmning. Blockerad autoplay eller API-fel lämnar bakgrundsbilden synlig. Iframen beskärs med `translate(-50%, -50%) scale(1.2)` i hero-sektionens `overflow: hidden`. Spelare och kontrollintervall städas vid filmbyte, paus och avmontering. `modestbranding` används inte eftersom parametern saknar effekt.
   - **Överlagrade gradienter:**
     - Mobil: `linear-gradient(to top, $color-bg 0%, rgba($color-bg, 0.85) 45%, rgba($color-bg, 0.3) 100%)`.
     - Desktop (`>= 768px`): `linear-gradient(to top, $color-bg 0%, transparent 25%)` kombinerat med `linear-gradient(to right, rgba($color-bg, 0.95) 0%, rgba($color-bg, 0.75) 35%, rgba($color-bg, 0.25) 70%, rgba($color-bg, 0.5) 100%)`.
   - **Innehållsblock till vänster (`.hero-section__text`, `max-width: 540px`):**
     - **Taggrad:** Genre-pills (`.hero-section__genre`), åldersbadge (`AgeBadge`), speltid (`formatDuration` + skärmläsartext `Speltid: {formatDurationLong}`).
     - **Huvudrubrik (`h1`):** Filmtitel (`.hero-section__title`).
     - **Ingress:** Filmens synopsis begränsad till 3 rader (`line-clamp: 3`).
     - **Knapprad:**
       - `Se Trailer` (sekundär knapp `.btn-hero-secondary` med play-ikon, länkar till `/filmer/:id?trailer=1` via `getMovieTrailerUrl(movie.id)` så att trailermodalen öppnas direkt på detaljsidan).
       - `Boka Biljett` (primär röd knapp `.btn-hero-primary`, länkar till `/filmer/:id` via `getMovieUrl(movie.id)`).
   - **Karusellkontroller (`.hero-carousel__controls`, visas när `movies.length > 1`):**
     - Föregående/nästa-pilar (`.hero-carousel__arrow--prev` / `--next`, `44×44px` på mobil, `52×52px` absolut positionerade på sidorna på `>= 768px`, `backdrop-filter: blur(6px)`).
     - Bottenrad (`.hero-carousel__bottom`): Paus/spela-knapp (`.hero-carousel__pause`, stoppar både bildspel och bakgrundstrailer) samt sidindikator-prickar (`.hero-carousel__dot`, `10×10px`, aktiv prick `28×10px` i `$color-primary` `#E50914`).
2. **Klibbig filterrad (`position: sticky`, `top: 64px`, `z-index: 40`, klass `.glass`, `border-bottom: 1px solid rgba(255, 255, 255, 0.07)`):**
   - Container (`max-width: 1280px`, `padding: 12px 16px`), staplad på mobil (`flex-col`), rad på `>= 640px` (`sm:flex-row`).
   - **Datumgrupp:** Etikett `Datum` (`12px`, `uppercase`, `#94A3B8`) + filterchips från `DATE_FILTERS`: `Idag`, `Imorgon`, `I helgen` *(Spec nämner även `"Helgen"`)* + en kalenderknapp som öppnar `DatePickerPopover` med val från idag till 60 dagar framåt. Snabbknappar och kalender delar samma kommande program från `useScreeningProgramme`. Datum med återstående visningar markeras i kalendern med en grön prick; datum utan visningar är nedtonade och kan inte väljas. `Idag`, `Imorgon` och `I helgen` spärras också när deras datumintervall saknar återstående visningar. Helgen avser lördag/söndag enligt API-kontraktet, och innevarande helg på söndagar. Tangentbords- och månadsnavigering hoppar över datum respektive månader utan visningar. Vid hämtning spärras datumval; fel visas med `Försök igen`, och ett tomt program förklaras i kalendern.
   - **Vertikal avdelare (`hidden sm:block`):** `width: 1px`, `background: rgba(255, 255, 255, 0.08)`.
   - **Åldersgrupp:** Etikett `Åldersgräns` (`12px`, `uppercase`, `#94A3B8`) + filterchips från `AGE_FILTERS`: `Alla`, `Barntillåten`, `7 år`, `11 år`, `15 år`.
3. **Repertoarsektion (`max-width: 1280px`, `padding: 40px 16px`):**
   - **Rubrik (`h2`):** `Repertoar — {activeDate}` (t.ex. `Repertoar — Idag`, `24px`, `Poppins`, `font-weight: 600`).
   - **Filmgrid:** `grid-cols-1` (`< 640px`), `sm:grid-cols-2` (`>= 640px`), `lg:grid-cols-3` (`>= 1024px`), `xl:grid-cols-4` (`>= 1280px`), `gap: 24px`.
   - **Sidnumrering:** `RepertoireSection.tsx` använder `usePagination(groups, 8)` efter gruppering och filtrering: högst 8 filmer per sida (2 rader × 4 kolumner på bred desktop). `Pagination` placeras under griden och döljs när högst 8 filmer finns. Byte av datum eller åldersfilter återställer sida 1. Sidan begränsas till giltigt intervall när resultatet krymper. Utseende och mobilvy enligt [§3.13](../components.md#313-sidnumrering-paginationtsx).
   - **Filmkort:** Återanvänder `Poster`, provar landskapsbilden om affischen inte laddas och visar därefter en reservyta med filmtitel. Visar affisch, åldersbadge (`Alla` i grönt `#10B981`, övriga `{ageRating} år` i rött `#E50914`), filmtitel, `{runtime} · {director}`, genre-pills samt klickbara visnings-pills grupperade per dag (`{time} · Stora` eller `{time} · Lilla`, plus `({seatsLeft} kvar)` i rött om `seatsLeft < 10`).
4. **Sidfot (`Footer`):** Se sektion 4.6.

#### Tillstånd och Interaktioner
- **Standardtillstånd:** Utan ett giltigt uttryckligt datumval väljs den första dagen med återstående visningar inom 60 dagar. Om det är idag används `Idag`, om det är imorgon används `Imorgon`, annars visas det valda datumet på kalenderknappen. Ett tomt program visar tomt tillstånd med spärrade datum. Uttryckliga val sparas som `?when=today|tomorrow|weekend` eller `?date=ÅÅÅÅ-MM-DD`; åldersgräns som `?age=0|7|11|15`. Även ett aktivt val av `Idag` sparas så att det skiljs från automatisk standard. Omladdning och bakåt/framåt bevarar giltiga uttryckliga val även när datumet senare saknar återstående visningar; sidan byter då inte datum i tysthet. Kalenderdatum valideras mot idag till 60 dagar framåt, och ogiltiga värden ger automatiskt standardval. Andra URL-parametrar bevaras.
- **Hero-rotation och tillgänglighet:**
  - Roterar automatiskt var 15:e sekund (`ROTATE_INTERVAL_MS = 15_000`) när mer än 1 film finns. Timern startas om vid manuellt byte av slide.
  - Rotationen pausas automatiskt vid mus-hover (`onMouseEnter`) och vid tangentbordsfokus (`:focus-visible`).
  - Om användaren har `prefers-reduced-motion: reduce` aktiverat startar karusellen i pausat läge och CSS-animationer stängs av.
- **Filtrering:** `useScreeningProgramme` hämtar kommande visningar i ett anrop. Kalender, snabbknappar och repertoar utgår från samma data. Datumintervall och åldersgräns filtreras lokalt enligt API-kontraktet och Stockholmsdatum; datumens tillgänglighet avser hela programmet. Visningar tas bort när starttiden passerar, med timer vid nästa start samt kontroll vid fokus, synlighetsbyte och periodiskt vid midnatt/klockändringar. Endast filmer med matchande återstående visningar listas i repertoaren. Automatisk standard flyttas till nästa visningsdag när dagens sista visning börjar, medan giltiga uttryckliga URL-val behålls.
- **Tomt tillstånd:** `Inga visningar hittades för vald dag och åldersgräns.` Vid laddning visas skelettkort och vid API-fel en svensk felnotis.
- **Filmkort och Boka Biljett:** Länkar till `/filmer/:id`. En visnings-pill länkar direkt till `/boka/:id`; fullbokade visningar visas som en icke-klickbar `Fullbokad`-etikett.
- **Seed och paginering:** Biografen har bara två salonger. De 12 aktuella seed-filmerna fördelas över flera dagar. Välj `I helgen` och `Alla` för att få flera sidor när återstående helgprogram innehåller fler än åtta filmer; en enskild dag eller en sen söndag kan korrekt sakna paginering.
