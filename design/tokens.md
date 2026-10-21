> Tillbaka till index: [DESIGN.md](../DESIGN.md) · Se även: [components.md](components.md) · [layout.md](layout.md) · [flows.md](flows.md) · [coverage.md](coverage.md)

## 2. Designtokens

Alla värden nedan är översatta till konkreta mått (`hex`, `rgba`, `px`, `rem`) anpassade för Bootstrap 5 + SCSS.

### 2.1 Färger

| Namn | Värde | Användning | Föreslaget SCSS-variabelnamn | Källfil |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | `#0B0F19` | Sidbakgrund (Deep Graphite Dark) | `$fv-bg` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| `--foreground` / `--card-foreground` | `#F8FAFC` | Primär text och rubriker (Crisp White) | `$fv-fg` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| `--card` | `#161F30` | Kort, paneler, modaler, tabeller, bottennavigering (Elevated Navy Slate) | `$fv-card-bg` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| `--primary` / `--ring` | `#E50914` | Primär accent, CTA-knappar, aktivt chip, fokusring, 15-årsbadge, Salong 1 | `$fv-primary` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| `--primary-foreground` / `--accent-foreground` | `#ffffff` | Text och ikoner på primär och grön accentbakgrund | `$fv-white` | `src/index.css` |
| `--secondary` | `#1E2D47` | Sekundär mörkblå yta definierad i `:root` | `$fv-secondary` | `src/index.css` |
| `--secondary-foreground` / `--muted-foreground` | `#94A3B8` | Sekundär/dämpad text, etiketter, inaktiva länkar (Cool Slate Gray) | `$fv-muted-fg` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| `--muted` | `#111827` | Dämpad mörk bakgrundsyta definierad i `:root` | `$fv-muted-bg` | `src/index.css` |
| `--accent` / `--success` | `#10B981` | Vald stol, bekräftelse, "Alla"-åldersbadge, betald status, Salong 2 (`SalongerScreen.tsx`) | `$fv-success` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| `--border` | `rgba(148, 163, 184, 0.15)` | Standardkantlinje (`1px solid`) för kort, inmatningsfält och tabeller | `$fv-border` | `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Seat Available | `#334155` | Ledig stol i salongskartor (`.seat-available`) och lägre beläggningsstapel (<= 50 %) | `$fv-seat-available` | `src/index.css`, `src/components/SeatSelectionScreen.tsx`, `src/components/admin/SchemaTab.tsx` |
| Seat Occupied | `#1E293B` (`opacity: 0.4`) | Upptagen/inaktiverad stol i salongskarta (`.seat-occupied`) | `$fv-seat-occupied` | `src/index.css`, `src/components/SeatSelectionScreen.tsx` |
| Danger Light | `#ff6b6b` | Varningstext vid få platser kvar, avboka-knapp, aktiv adminflik, Salong 1-badge i admin, inställd visning | `$fv-danger-light` | `src/components/HomeScreen.tsx`, `src/components/MovieDetailScreen.tsx`, `src/components/AdminScreen.tsx` |
| Warning / Amber | `#F59E0B` | IMDb-stjärna och betyg, 7/11-årsbadge (`FilmerScreen.tsx`), "Inväntar"-status, beläggning > 80 %, lösenordsstyrka "Okej" | `$fv-warning` | `src/components/FilmerScreen.tsx`, `src/components/ProfilScreen.tsx`, `src/components/admin/BokningarTab.tsx` |
| Warning Dark | `#D97706` | Startfärg i premiärbadge-gradient (`linear-gradient(135deg, #D97706 0%, #F59E0B 100%)`) | `$fv-warning-dark` | `src/components/FilmerScreen.tsx` |
| Info / Accessible Blue | `#3B82F6` | Rullstolsplatser, "Tillgänglig"-badge, punktlista (`SalongerScreen.tsx`), KPI-kort "Dagens bokningar" | `$fv-info` | `src/components/SalongerScreen.tsx`, `src/components/admin/BokningarTab.tsx`, `src/components/admin/SalongerAdminTab.tsx` |
| Info Light Blue | `#60A5FA` | Textfärg för Salong 2-badge i admin-visningsschema (`SchemaTab.tsx`) | `$fv-info-light` | `src/components/admin/SchemaTab.tsx` |
| Password Weak Red | `#EF4444` | Färg för lösenordsstyrka nivå 1 ("Svagt") | `$fv-danger-weak` | `src/components/ProfilScreen.tsx` |
| Avatar Purple | `#7C3AED` | Slutfärg i profil-avatargradient (`linear-gradient(135deg, #E50914 0%, #7C3AED 100%)`) | `$fv-purple` | `src/components/ProfilScreen.tsx` |
| Primary Dark | `#B2070F` | Slutfärg i gäst-avatargradient (`linear-gradient(135deg, #E50914 0%, #B2070F 100%)`) | `$fv-primary-dark` | `src/components/MobileDrawer.tsx` |
| Drawer Background | `#0F1729` | Bakgrundsfärg på sidopanelen i `MobileDrawer` | `$fv-drawer-bg` | `src/components/MobileDrawer.tsx` |
| Poster Placeholder | `#0d1321` / `#0f172a` / `#1e293b` | Bakgrund bakom film- och salongsbilder (`#0d1321`, `bg-slate-900`, `bg-slate-800`) | `$fv-poster-bg` | `src/components/FilmerScreen.tsx`, `src/components/HomeScreen.tsx`, `src/components/admin/FilmarkivTab.tsx` |
| Video Player Background | `#050810` | Bakgrund i 16:9 trailer-modal | `$fv-video-bg` | `src/components/FilmerScreen.tsx` |
| Policy Notice Bg | `rgba(255, 200, 0, 0.06)` | Bakgrund för gul kassabetalningsnotis i stolsväljaren | `$fv-policy-bg` | `src/components/SeatSelectionScreen.tsx` |
| Policy Notice Border | `rgba(255, 200, 0, 0.15)` | Kantlinje för gul kassabetalningsnotis i stolsväljaren | `$fv-policy-border` | `src/components/SeatSelectionScreen.tsx` |
| Cancelled Badge Bg | `rgba(153, 27, 27, 0.2)` | Bakgrund för "Inställd"-badge på desktop i admin-schemat | `$fv-cancelled-bg` | `src/components/admin/SchemaTab.tsx` |
| Glass Surface Bg | `rgba(22, 31, 48, 0.7)` | Semitransparent bakgrund för `.glass`-ytor (`border: 1px solid rgba(255, 255, 255, 0.08)`) | `$fv-glass-bg` | `src/index.css` |
| Nav Surface Bg | `rgba(11, 15, 25, 0.9)` | Semitransparent bakgrund för publik toppnavigering (`0.95` i admin) | `$fv-nav-bg` | `src/components/Nav.tsx`, `src/components/AdminScreen.tsx` |

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
| Logotyp (`FILMVISARNA`) | `Poppins` | Publik: `16px` (`1rem`), Admin: `14px` (`13px` mobil) | `font-weight: 700`, `uppercase`, `letter-spacing: 0.18em` (`0.16em` admin) | `$fv-fs-logo` | `src/components/Nav.tsx`, `src/components/AdminScreen.tsx` |
| Brödtext stor / Korttitel | `Inter` / `Poppins` | `16px` (`1rem`) / `15px` (`0.9375rem`) | `font-weight: 400` / `600`, `line-height: 1.625` | `$fv-fs-base` | `src/components/HomeScreen.tsx`, `src/components/FilmerScreen.tsx` |
| Standardtext / Knappar / Fält | `Inter` | `14px` (`0.875rem`) | `font-weight: 400` / `500` / `600` | `$fv-fs-sm` | `src/components/Nav.tsx`, `src/components/ProfilScreen.tsx` |
| Chip / Kompakt knapp | `Inter` | `13px` (`0.8125rem`) | `font-weight: 500` / `600` | `$fv-fs-xs-plus` | `src/index.css`, `src/components/FilmerScreen.tsx` |
| Etikett / Tabellhuvud / Badge | `Inter` | `12px` (`0.75rem`) / `11px` (`0.6875rem`) | `font-weight: 500` / `600` / `700` | `$fv-fs-xs` | `src/components/MovieDetailScreen.tsx`, `src/components/admin/BokningarTab.tsx` |
| Mikrotext / Bottennav / Minikarta | `Inter` / `JetBrains Mono` | `10px` (`0.625rem`) / `9px` (`0.5625rem`) / `8px` (`0.5rem`) | `font-weight: 400` / `600` / `700` | `$fv-fs-xxs` | `src/components/BottomNav.tsx`, `src/components/SalongerScreen.tsx`, `src/components/admin/SalongerAdminTab.tsx` |

### 2.3 Avstånd (Spacing) och Layoutmått

| Namn | Värde | Användning | Föreslaget SCSS-variabelnamn | Källfil |
| :--- | :--- | :--- | :--- | :--- |
| Bas-skala (8px-system) | `8px`, `16px`, `24px`, `32px`, `48px`, `64px` (`0.5rem`–`4rem`) | Generellt avståndssystem för marginaler, padding och gaps | `$fv-space-1` … `$fv-space-6` | `src/imports/pasted_text/filmvisarna-booking-spec.md` |
| Nav-höjd (publik) | `64px` (`4rem`) | Fast höjd på global toppnavigering (`Nav.tsx`) | `$fv-nav-height` | `src/components/Nav.tsx` |
| Nav-höjd (admin) | `56px` (`3.5rem`) | Fast höjd på admin-huvudrad (`AdminScreen.tsx`) | `$fv-admin-nav-height` | `src/components/AdminScreen.tsx` |
| BottomNav-höjd (mobil) | `64px` (`4rem`) | Fast höjd på mobil bottennavigering (`BottomNav.tsx`) | `$fv-bottom-nav-height` | `src/components/BottomNav.tsx` |
| Container Max-Width (Admin) | `1600px` (`100rem`) | Maxbredd i `AdminScreen.tsx` (`padding: 0 40px` desktop, `0 16px` mobil) | `$fv-container-admin` | `src/components/AdminScreen.tsx` |
| Container Max-Width (XL / 7xl) | `1280px` (`80rem`) | Maxbredd i `Nav.tsx`, `HomeScreen.tsx`, `FilmerScreen.tsx`, `SalongerScreen.tsx` | `$fv-container-7xl` | `src/components/Nav.tsx`, `src/components/HomeScreen.tsx` |
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

