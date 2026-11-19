> Tillbaka till index: [DESIGN.md](../DESIGN.md) · Se även: [components.md](components.md) · [layout.md](layout.md) · [flows.md](flows.md) · [coverage.md](coverage.md)

## 2. Designtokens

Alla värden nedan är översatta till konkreta mått (`hex`, `rgba`, `px`, `rem`) anpassade för Bootstrap 5 + SCSS.

### 2.1 Färger

Aktuell källa är `Frontend/src/styles/_tokens.scss`. `:root, [data-theme="dark"]` definierar mörkt standardtema; `[data-theme="light"]` definierar ljust. Värdena nedan gäller den implementerade applikationen och ersätter prototypens fasta mörka färger.

| CSS-token | Mörkt | Ljust | Sass / användning |
| :--- | :--- | :--- | :--- |
| `--color-bg` | `#0B0F19` | `#F8FAFC` | `$color-bg`, `$fv-bg`: sidbakgrund |
| `--color-bg-darkest` | `#060910` | `#E2E8F0` | Bakgrundsvariation |
| `--color-surface` | `#161F30` | `#FFFFFF` | `$fv-card-bg`: kort, modaler, sidfot |
| `--color-surface-2` | `#1E2D47` | `#E2E8F0` | `$fv-secondary`: sekundär yta |
| `--color-surface-muted` | `#111827` | `#F1F5F9` | `$fv-muted-bg`: formulär och dämpade ytor |
| `--color-surface-chip` | `#0F172A` | `#F1F5F9` | Chips |
| `--color-surface-chip-hover` | `#1E293B` | `#E2E8F0` | Chip-hover |
| `--color-drawer-bg` | `#0F1729` | `#FFFFFF` | `$fv-drawer-bg`: mobilmeny |
| `--color-poster-bg` | `#0D1321` | `#E2E8F0` | `$fv-poster-bg`: bildreserv |
| `--text-primary` | `#F8FAFC` | `#0F172A` | `$fv-fg`: brödtext |
| `--text-heading` | `#FFFFFF` | `#0B0F19` | Rubriker |
| `--text-secondary` | `#CBD5E1` | `#334155` | Sekundär text |
| `--text-muted` | `#94A3B8` | `#475569` | `$fv-muted-fg`: dämpad text |
| `--color-primary` | `#E50914` | `#C40712` | `$fv-primary`: primärknapp, fokusring |
| `--color-primary-dark` | `#B2070F` | `#A3060E` | `$fv-primary-dark`: knapp-hover |
| `--color-success` | `#10B981` | `#036347` | `$fv-success`: gröna statusar |
| `--color-warning` | `#F59E0B` | `#92400E` | `$fv-warning`: betyg och varningar |
| `--color-warning-dark` | `#D97706` | `#78350F` | Premiärgradient |
| `--color-danger`, `--color-danger-soft` | `#FF6B6B` | `#B91C1C` | `$fv-danger-weak`, `$fv-danger-light`: fel/avbokningstext |
| `--color-info`, `--color-info-light` | `#60A5FA` | `#1D4ED8` | `$fv-info`, `$fv-info-light`: tillgänglighet och information |
| `--color-purple` | `#7C3AED` | `#6D28D9` | Avatargradient |
| `--color-border-rgb` | `148, 163, 184` | `100, 116, 139` | `--border-default`: kanaler med alfa `0.15` |
| `--surface-overlay-rgb` | `255, 255, 255` | `15, 23, 42` | `$white-overlay-*`: diskreta bakgrunder och kantlinjer |
| `--seat-available-bg` / `--seat-available-border` | `#334155` / `#94A3B8` | `#E2E8F0` / `#475569` | Ledig stol |
| `--seat-selected-bg` / `--seat-selected-border` | `#10B981` / `#A7F3D0` | `#036347` / `#065F46` | Vald stol |
| `--seat-occupied-bg` / `--seat-occupied-border` | `#1E293B` / `#64748B` | `#CBD5E1` / `#64748B` | Upptagen stol |
| `--seat-occupied-strike` | `#94A3B8` | `#475569` | Markering av upptagen stol |
| `--text-on-success` | `#0B0F19` | `#FFFFFF` | Text på fylld grön yta/vald stol |
| `--text-on-danger` | `#0B0F19` | `#FFFFFF` | Text på fylld `--color-danger` |

#### RGB-kanaler, Sass och Bootstrap

- Varje färg i paletten får också en `--*-rgb`-token med kommaseparerade kanaler, till exempel `--color-bg-rgb` och `--text-primary-rgb`. Sass-alias som `$fv-bg` och `$color-bg` är `rgb(var(--color-bg-rgb))`; de följer temat utan omkompilering.
- Använd `tint($fv-primary, 0.15)` för transparens på RGB-tokens. Sass kan inte beräkna `rgba($fv-primary, 0.15)` när värdet är en CSS-variabel. Hjälparen lämnar `rgba(var(--color-primary-rgb), 0.15)` till webbläsaren.
- `$white-overlay-*` använder `--surface-overlay-rgb`: vitt i mörkt tema och mörkt bläck i ljust. Använd dem för neutrala komponentytor, hover och kantlinjer, inte för vit text på bilder. Tillgängliga alfasteg: `02`, `03`, `04`, `05`, `06`, `07`, `08`, `10`, `14`, `15`, `20`, `25`, `50`.
- `$fv-nav-bg` använder bakgrundens RGB-kanaler med alfa `0.9` och `$fv-glass-bg` kortytans med alfa `0.7`.
- Bootstrap får fasta Sass-färger för beräkningar av kontrast, färgmixning och SVG. `fv-bootstrap-theme` inkluderas efter Bootstrap och kopplar dess CSS-variabler och formulär till aktuella tokens. `bg-body` och `text-body` följer därför temat.
- Äldre semantiska alias (`--background`, `--foreground`, `--card`, `--primary`, `--accent` med flera) pekar på samma temafärger. Geometri, typografi och brytpunkter ändras inte med temat.

#### Bildkontrast och fasta färger

`--image-scrim` (`#0B0F19`), `--image-text` (`#FFFFFF`) och `--image-text-muted` (`#CBD5E1`) är fasta i båda teman och har RGB-kanaler samt Sass-alias `$image-scrim`, `$image-text`, `$image-text-muted`. Startsidan visar hero-texten direkt över en mörk riktad gradient, utan separat kortruta. På desktop har gradienten minst `0.85` opacitet genom textkolumnen och tonar bort mot bildens högra sida; på mobil går den nedifrån och upp. Bara de nedersta `64px` tonar mot `var(--color-bg)`, så att trailern inte täcks av en ljus slöja. Vita bildkontroller och salongsbildernas vita märkningar har egna mörka kontrastplattor.

`--color-white` (`#FFFFFF`), `--color-black` (`#000000`) och `--color-video-bg` (`#050810`) är också fasta. Vit text på primära knappar ska använda `$fv-white`, inte den temaväxlande rubrikfärgen. Modalbackdrops förblir mörka; modalens innehåll, sidfot och draghandtag följer temat. Skeleton använder `--color-surface-muted` och `--color-surface-2`, även med reducerad rörelse.

#### Verifiering

`Frontend/tests/locale-storage.test.ts` testar lagring, standardvärden och blockerad/saknad lagring för språk och tema samt synkron tillämpning vid sidstart. `theme.test.ts` kontrollerar minst `4,5:1` kontrast för testade text-/ytpar samt bildtext över en vit bild med mörk platta.

Kör `npm test`, `npm run lint` och `npm run build` i `Frontend/`. Granska dessutom hero, filmdetaljer, salonger, formulär, dialoger och hover/fokus visuellt i båda teman och på mobilbredd. Datum- och tidfält ärver `color-scheme` från dokumentets tema.

### 2.2 Typografi

| Token / Element | Typsnitt | Storlek (px / rem) | Vikt & Egenskaper | Föreslaget SCSS-variabelnamn | Källfil |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--font-display` | `'Poppins', system-ui, sans-serif` | — | Vikt `400, 500, 600, 700, 800` | `$fv-font-display` | `src/index.css` |
| `--font-sans` | `'Inter', system-ui, sans-serif` | — | Vikt `300, 400, 500, 600, 700` | `$fv-font-sans` | `src/index.css` |
| `--font-jetbrains` / `--font-mono` | `'JetBrains Mono', 'Courier New', monospace` | — | Vikt `400, 600` | `$fv-font-mono` | `src/index.css` |
| Hero-rubrik (`h1`) | `Poppins` | Mobil: `48px` (`3rem`), `>= 640px`: `60px` (`3.75rem`) *(Spec: `28px` mobil / `48px` desktop)* | `font-weight: 700`, `line-height: 1.25` | `$fv-fs-hero` | `src/components/HomeScreen.tsx`, `src/imports/pasted_text/cinema-app-screens.md` |
| Sidrubrik stor (`h1`) | `Poppins` | Mobil: `36px` (`2.25rem`), `>= 640px`: `48px` (`3rem`) | `font-weight: 700`, `line-height: 1.25` | `$fv-fs-h1-lg` | `src/components/MovieDetailScreen.tsx`, `src/components/SalongerScreen.tsx` |
| Sidrubrik responsiv (`h1`) | `Poppins` | `clamp(24px, 4vw, 38px)` (`1.5rem`–`2.375rem`) | `font-weight: 800`, `letter-spacing: -0.02em` | `$fv-fs-h1-clamp` | `src/components/FilmerScreen.tsx` |
| Bekräftelserubrik & Bokningskod | `Poppins` / `JetBrains Mono` | `30px` (`1.875rem`) | `font-weight: 700` (kod: `letter-spacing: 0.2em`) | `$fv-fs-display-sm` | `src/components/BookingConfirmScreen.tsx` |
| Sidrubrik profil (`h1`) | `Poppins` | `28px` (`1.75rem`) | `font-weight: 700` | `$fv-fs-h1-md` | `src/components/ProfilScreen.tsx` |
| Sektionsrubrik (`h2`) | `Poppins` | `24px` (`1.5rem`) | `font-weight: 600` / `700` | `$fv-fs-h2` | `src/components/HomeScreen.tsx`, `src/components/SalongerScreen.tsx`, `src/components/admin/BokningarTab.tsx` |
| Admin-/modalrubrik (`h1`/`h2`) | `Poppins` | `22px` (`1.375rem`) | `font-weight: 700` | `$fv-fs-h2-sm` | `src/components/AdminScreen.tsx`, `src/components/FilmerScreen.tsx` |
| Kort-/undersektion (`h2`/`h3`) | `Poppins` | `20px` (`1.25rem`) | `font-weight: 700` | `$fv-fs-h3` | `src/components/MyBookingsScreen.tsx`, `src/components/SalongerScreen.tsx`, `src/components/admin/SalongerAdminTab.tsx` |
| Panel-/modalrubrik (`h2`/`h3`) | `Poppins` | `17px`–`18px` (`1.0625rem`–`1.125rem`) | `font-weight: 600` / `700` | `$fv-fs-h4` | `src/components/SeatSelectionScreen.tsx`, `src/components/ProfilScreen.tsx`, `src/components/admin/SchemaTab.tsx` |
| Logotyp (`FILMVISARNA`) | `Poppins` | `16px` (`1rem`) i både publik vy och admin | `font-weight: 700`, `uppercase`, `letter-spacing: 0.18em` | `$fv-fs-logo` | `Frontend/src/components/BrandLogo.tsx` |
| Brödtext stor / Korttitel | `Inter` / `Poppins` | `16px` (`1rem`) / `15px` (`0.9375rem`) | `font-weight: 400` / `600`, `line-height: 1.625` | `$fv-fs-base` | `src/components/HomeScreen.tsx`, `src/components/FilmerScreen.tsx` |
| Standardtext / Knappar / Fält | `Inter` | `14px` (`0.875rem`) | `font-weight: 400` / `500` / `600` | `$fv-fs-sm` | `src/components/Nav.tsx`, `src/components/ProfilScreen.tsx` |
| Chip / Kompakt knapp | `Inter` | `13px` (`0.8125rem`) | `font-weight: 500` / `600` | `$fv-fs-xs-plus` | `src/index.css`, `src/components/FilmerScreen.tsx` |
| Etikett / Tabellhuvud / Badge | `Inter` | `12px` (`0.75rem`) / `11px` (`0.6875rem`) | `font-weight: 500` / `600` / `700` | `$fv-fs-xs` | `src/components/MovieDetailScreen.tsx`, `src/components/admin/BokningarTab.tsx` |
| Mikrotext / Bottennav / Minikarta | `Inter` / `JetBrains Mono` | `10px` (`0.625rem`) / `9px` (`0.5625rem`) / `8px` (`0.5rem`) | `font-weight: 400` / `600` / `700` | `$fv-fs-xxs` | `src/components/BottomNav.tsx`, `src/components/SalongerScreen.tsx`, `src/components/admin/SalongerAdminTab.tsx` |

### 2.3 Avstånd (Spacing) och Layoutmått

| Namn | Värde | Användning | Föreslaget SCSS-variabelnamn | Källfil |
| :--- | :--- | :--- | :--- | :--- |
| Bas-skala (8px-system) | `8px`, `16px`, `24px`, `32px`, `48px`, `64px` (`0.5rem`–`4rem`) | Generellt avståndssystem för marginaler, padding och gaps | `$fv-space-1` … `$fv-space-6` | `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Nav-höjd (publik & admin) | `64px` (`4rem`) | Fast höjd på gemensam toppnavigering (`Navbar.tsx`) i både publik vy och admin | `$fv-nav-height` | `Frontend/src/components/Navbar.tsx` |
| BottomNav-höjd (mobil) | `64px` (`4rem`) | Fast höjd på mobil bottennavigering (`BottomNav.tsx`) i både publik vy och admin | `$fv-bottom-nav-height` | `Frontend/src/components/BottomNav.tsx` |
| Container Max-Width (XL / 7xl) | `1280px` (`80rem`) | Maxbredd i `Navbar.tsx` (publik & admin), `HomeScreen.tsx`, `FilmerScreen.tsx`, `SalongerScreen.tsx` | `$fv-container-7xl` | `Frontend/src/components/Navbar.tsx`, `src/components/HomeScreen.tsx` |
| Container Max-Width (6xl) | `1152px` (`72rem`) | Maxbredd i `MovieDetailScreen.tsx`, `SeatSelectionScreen.tsx` | `$fv-container-6xl` | `src/components/MovieDetailScreen.tsx`, `src/components/SeatSelectionScreen.tsx` |
| Container Max-Width (5xl) | `1024px` (`64rem`) | Maxbredd i `ProfilScreen.tsx` | `$fv-container-5xl` | `src/components/ProfilScreen.tsx` |
| Container Max-Width (4xl) | `896px` (`56rem`) | Maxbredd i `CookieBanner.tsx` | `$fv-container-4xl` | `src/components/CookieBanner.tsx` |
| Container Max-Width (3xl) | `768px` (`48rem`) | Maxbredd i `MyBookingsScreen.tsx` och hero-text på `HomeScreen.tsx` | `$fv-container-3xl` | `src/components/MyBookingsScreen.tsx`, `src/components/HomeScreen.tsx` |
| Desktop Grid (Spec) | `1440px` bredd, 12 kolumner, `24px` gutter, `120px` yttre marginal | Kravspecens övergripande desktop-grid | `$fv-grid-gutter-desktop` | `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Mobile Grid (Spec) | `390px` bredd, 4 kolumner, `16px` gutter, `16px` yttre marginal | Kravspecens övergripande mobil-grid | `$fv-grid-gutter-mobile` | `src/imports/pasted_text/filmvisarna-booking-spec.md` |

### 2.4 Hörnradier (Border Radius)

| Namn | Värde | Användning | Föreslaget SCSS-variabelnamn | Källfil |
| :--- | :--- | :--- | :--- | :--- |
| `--radius-sm` | `6px` (`0.375rem`) | Små badges, biljettkodbrickor, ålderschips (`AgeChip`) | `$fv-radius-sm` | `src/index.css`, `src/components/FilmerScreen.tsx` |
| `--radius` / `--radius-md` | `10px` (`0.625rem`) | Standardknappar ("Bli Medlem"), inmatningsfält, menyval i mobilmeny | `$fv-radius-md` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| `--radius-lg` | `14px` (`0.875rem`) | Mobila kort i admin (`BokningarTab.tsx`, `SchemaTab.tsx`, `FilmarkivTab.tsx`) | `$fv-radius-lg` | `src/index.css`, `src/components/admin/BokningarTab.tsx` |
| `--card-radius` | `16px` (`1rem`) | Standardkort (`rounded-2xl`), paneler, tabellcontainers och modaler | `$fv-card-radius` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Inner Card / Button XL | `12px` (`0.75rem`) | Hero-knappar (`rounded-xl`), inre informationsrutor, cookie-knappar | `$fv-radius-xl` | `src/components/HomeScreen.tsx`, `src/components/CookieBanner.tsx` |
| Modal / BottomSheet Radius | `20px` (`1.25rem`) | `TrailerModal` (`20px`) samt mobila `BottomSheet` (`20px 20px 0 0`) | `$fv-radius-modal` | `src/components/FilmerScreen.tsx`, `src/components/admin/SchemaTab.tsx` |
| Confirmation Card Radius | `24px` (`1.5rem`) | Yttre kort på bokningsbekräftelsen (`rounded-3xl`) | `$fv-radius-3xl` | `src/components/BookingConfirmScreen.tsx` |
| Seat Radius | `6px 6px 3px 3px` | Stolsikoner i stolsväljaren (`.seat`), `6px` enligt spec | `$fv-radius-seat` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Chip / Pill Radius | `20px` / `9999px` | Filterchips (`.chip` har `20px`), runda knappar, avatarer och statuspills (`9999px`) | `$fv-radius-pill` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |

### 2.5 Skuggor och Oskärpa (Shadows & Blur)

| Namn | Värde | Användning | Föreslaget SCSS-variabelnamn | Källfil |
| :--- | :--- | :--- | :--- | :--- |
| Card Hover Shadow (Home) | `0 16px 40px rgba(0, 0, 0, 0.4)` | Skugga vid hover på filmkort på startsidan | `$fv-shadow-card-lg` | `src/components/HomeScreen.tsx` |
| Card Hover Shadow (Filmer) | `0 12px 32px rgba(0, 0, 0, 0.4)` | Skugga vid hover på filmkort på filmsidan | `$fv-shadow-card-md` | `src/components/FilmerScreen.tsx` |
| Poster Shadow (`shadow-2xl`) | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` | Skugga på filmposter i `MovieDetailScreen.tsx` | `$fv-shadow-poster` | `src/components/MovieDetailScreen.tsx` |
| BottomNav Shadow | `0 -4px 24px rgba(0, 0, 0, 0.4)` | Uppåtriktad skugga på mobil bottennavigering | `$fv-shadow-bottom-nav` | `src/components/BottomNav.tsx` |
| Selected Seat Glow | `0 0 10px rgba(16, 185, 129, 0.5)` | Grön glöd på vald stol (`.seat-selected`, `8px` i legend) | `$fv-glow-seat` | `src/index.css`, `src/components/SeatSelectionScreen.tsx` |
| Trailer Play Glow | `0 0 40px rgba(229, 9, 20, 0.5)` | Röd glöd runt play-knappen i `TrailerModal` | `$fv-glow-play` | `src/components/FilmerScreen.tsx` |
| Glass Blur | `blur(12px)` | Standardoskärpa för `.glass` (`14px` i `Nav`/`AdminScreen`, `20px` i `CookieBanner`) | `$fv-blur-glass` | `src/index.css`, `src/components/Nav.tsx`, `src/components/CookieBanner.tsx` |

### 2.6 Brytpunkter och Z-index

| Kategori | Namn | Värde | Användning | Föreslaget SCSS-variabelnamn | Källfil |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Brytpunkt | Mobile Spec | `390px` | Referensbredd för mobil i kravspecen | `$fv-bp-xs` | `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Brytpunkt | `sm` | `640px` | 2 kolumner i filmgrid (`HomeScreen`), större rubriker, sidopadding | `$fv-bp-sm` | `src/components/HomeScreen.tsx`, `src/components/MovieDetailScreen.tsx` |
| Brytpunkt | `md` / `useIsMobile` | `768px` | Skiljelinje mellan mobil (`< 768px`) och desktop (`>= 768px`) i `useIsMobile`, `Nav`, `BottomNav` | `$fv-bp-md` | `src/hooks/useIsMobile.ts`, `src/components/Nav.tsx`, `src/components/BottomNav.tsx` |
| Brytpunkt | `lg` | `1024px` | 3 kolumner i filmgrid, flerkolumnslayout i `MovieDetailScreen`, `SeatSelectionScreen`, `SalongerScreen`, `ProfilScreen` | `$fv-bp-lg` | `src/components/MovieDetailScreen.tsx`, `src/components/SeatSelectionScreen.tsx` |
| Brytpunkt | `xl` | `1280px` | 4 kolumner i filmgrid på startsidan (`xl:grid-cols-4`) | `$fv-bp-xl` | `src/components/HomeScreen.tsx` |
| Brytpunkt | Desktop Spec | `1440px` | Referensbredd för desktop i kravspecen | `$fv-bp-xxl` | `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Z-index | Innehåll över hero | `10` | Innehållskolumner som överlappar hero-bild (`MovieDetailScreen`, `SalongerScreen`) | `$fv-z-content` | `src/components/MovieDetailScreen.tsx`, `src/components/SalongerScreen.tsx` |
| Z-index | Sticky Filter | `40` | Klibbig filterrad under toppnavigeringen (`top: 64px`) | `$fv-z-sticky` | `src/components/HomeScreen.tsx`, `src/components/FilmerScreen.tsx` |
| Z-index | Navigation & Modaler | `50` | `Nav`, `BottomNav`, `CookieBanner`, `AdminScreen`-topbar, avbokningsmodal och desktop-modaler i admin | `$fv-z-fixed` | `src/components/Nav.tsx`, `src/components/BottomNav.tsx`, `src/components/CookieBanner.tsx` |
| Z-index | Admin BottomSheet | `200` / `201` | Backdrop (`200`) och panel (`201`) för mobila `BottomSheet` i admin | `$fv-z-bottom-sheet` | `src/components/admin/SchemaTab.tsx`, `src/components/admin/FilmarkivTab.tsx` |
| Z-index | MobileDrawer | `998` / `999` | Backdrop (`998`) och sidopanel (`999`) för mobilmeny | `$fv-z-drawer` | `src/components/MobileDrawer.tsx` |
| Z-index | TrailerModal | `1000` | Högsta lager för videomodal på filmsidan | `$fv-z-modal-top` | `src/components/FilmerScreen.tsx` |

