> Bygger på: [tokens.md](tokens.md) · Tillbaka till index: [DESIGN.md](../DESIGN.md) · Se även: [layout.md](layout.md) · [flows.md](flows.md) · [coverage.md](coverage.md)

## 3. Komponenter

Här dokumenteras samtliga återanvända UI-delar i prototypen med utseende, mått, tillstånd och källfiler.

### 3.1 Knappar (Buttons)

1. **Primär knapp (Primary CTA)**
   - **Utseende:** Bakgrund `#E50914` (`var(--primary)`), text `#ffffff`, `font-weight: 600`, `border: none`.
   - **Storlekar och radier:**
     - Nav (`Bli Medlem`, `Nav.tsx`): `padding: 8px 16px`, `font-size: 14px`, `border-radius: 10px`.
     - Hero (`Boka Biljett`, `HomeScreen.tsx`): `padding: 12px 24px`, `font-size: 14px`, `border-radius: 12px`, med högerpilikon (`16×16px`).
     - Kortknapp (`Köp biljetter`, `FilmerScreen.tsx`): `width: 100%`, `padding: 10px`, `font-size: 13px`, `border-radius: 8px`, `letter-spacing: 0.02em`.
     - Checkout (`Slutför bokning`, `SeatSelectionScreen.tsx`): `width: 100%`, `padding: 14px 0`, `font-size: 14px`, `border-radius: 12px`.
   - **Tillstånd:**
     - **Standard:** `opacity: 1`, `cursor: pointer`.
     - **Fokus (`focus-visible`):** `outline: 2px solid #E50914`, `outline-offset: 2px` (`src/index.css`).
     - **Inaktiverad (`disabled`):** `opacity: 0.4`, `cursor: not-allowed` (`SeatSelectionScreen.tsx`).
     - **Sparad-bekräftelse (`FilmarkivTab.tsx`):** Skiftar bakgrund till `#10B981` under 2 sekunder med bockikon och texten `Sparad!`.
   - **Källfiler:** `src/index.css`, `src/components/Nav.tsx`, `src/components/HomeScreen.tsx`, `src/components/FilmerScreen.tsx`, `src/components/SeatSelectionScreen.tsx`, `src/components/admin/FilmarkivTab.tsx`.

2. **Sekundär knapp (Dark Outline / Ghost)**
   - **Utseende:** Transparent eller svagt tonad bakgrund (`rgba(255, 255, 255, 0.04)` till `0.08`), kantlinje `1px solid rgba(148, 163, 184, 0.25)` (eller `rgba(255, 255, 255, 0.1)`), text `#F8FAFC` eller `#94A3B8`, `border-radius: 8px`–`12px`.
   - **Variant – Glasmorfisk (`Se Trailer` på `HomeScreen.tsx`, `Tillbaka` på `MovieDetailScreen.tsx`):** Klass `.glass` (`background: rgba(22, 31, 48, 0.7)`, `backdrop-filter: blur(12px)`), `border: 1px solid rgba(255, 255, 255, 0.18)` (eller `0.1`), text `#F8FAFC`.
   - **Tillstånd:** I `Nav.tsx` (`Logga in`) får aktivt tillstånd (`currentScreen === 'profil'`) text `#F8FAFC` och bakgrund `rgba(248, 250, 252, 0.07)`.
   - **Källfiler:** `src/index.css`, `src/components/Nav.tsx`, `src/components/HomeScreen.tsx`, `src/components/MovieDetailScreen.tsx`, `src/components/BookingConfirmScreen.tsx`, `src/components/ProfilScreen.tsx`.

3. **Destruktiv / Röd sekundärknapp (`Avboka biljett`, `Avboka`, `Ställ in`, `Ta bort`)**
   - **Utseende:** Bakgrund `transparent` eller `rgba(229, 9, 20, 0.06)`–`0.1`, kantlinje `1px solid rgba(229, 9, 20, 0.2)`–`0.3`, text `#ff6b6b` (i `MobileDrawer.tsx` `Logga ut`: kantlinje `rgba(229, 9, 20, 0.4)`, text `#E50914`), `border-radius: 8px`–`12px`.
   - **Tillstånd:**
     - **Inaktiverad (`disabled`):** `opacity: 0.4` när en visning redan är inställd (`SchemaTab.tsx`).
     - **Inline-bekräftelse (`SchemaTab.tsx`, `FilmarkivTab.tsx`, `SalongerAdminTab.tsx`):** Vid klick ersätts knappen direkt av två knappar bredvid varandra: `Bekräfta` (bakgrund `#E50914`, vit text) och `Avbryt` (bakgrund `rgba(255, 255, 255, 0.05)`, text `#94A3B8`).
   - **Källfiler:** `src/components/BookingConfirmScreen.tsx`, `src/components/MyBookingsScreen.tsx`, `src/components/MobileDrawer.tsx`, `src/components/admin/BokningarTab.tsx`, `src/components/admin/SchemaTab.tsx`, `src/components/admin/FilmarkivTab.tsx`, `src/components/admin/SalongerAdminTab.tsx`.

4. **Grön åtgärdsknapp (`Markera betald`)**
   - **Utseende:** Bakgrund `rgba(16, 185, 129, 0.12)` (mobil) / `0.15` (desktop), kantlinje `1px solid rgba(16, 185, 129, 0.3)` (mobil) / `0.25` (desktop), text `#10B981`, bockikon, `border-radius: 10px` (mobil) / `8px` (desktop).
   - **Tillstånd:** När bokningen är betald ersätts knappen av en icke-klickbar bricka med bakgrund `rgba(16, 185, 129, 0.08)` och texten `✓ Betald` i `#10B981`.
   - **Källfil:** `src/components/admin/BokningarTab.tsx`.

5. **Tertiär knapp / Textlänk**
   - **Utseende:** Ingen bakgrund eller kantlinje, text `#94A3B8` (`Tillbaka till startsidan` i `BookingConfirmScreen.tsx`, `Tillbaka` i `SeatSelectionScreen.tsx` och `ProfilScreen.tsx`, understrukna länkar i footer) eller `#E50914` (`Rensa filter` och `Visa alla filmer` i `FilmerScreen.tsx`).
   - **Källfiler:** `src/components/BookingConfirmScreen.tsx`, `src/components/SeatSelectionScreen.tsx`, `src/components/ProfilScreen.tsx`, `src/components/FilmerScreen.tsx`, `src/components/HomeScreen.tsx`.

### 3.2 Filter-chips och Visnings-pills

1. **Standard-chip (`.chip`)**
   - **Utseende:** `display: inline-flex`, `align-items: center`, `padding: 6px 14px`, `border-radius: 20px`, `font-size: 13px`, `font-weight: 500`.
   - **Tillstånd:**
     - **Inaktiv (`.chip-inactive`):** Bakgrund `#161F30`, text `#94A3B8`, kantlinje `1px solid rgba(148, 163, 184, 0.15)`.
     - **Hover på inaktiv (`.chip-inactive:hover`):** Kantlinje `rgba(255, 255, 255, 0.2)`, text `#F8FAFC`.
     - **Aktiv (`.chip-active`):** Bakgrund `#E50914`, text `#ffffff`, kantlinje `1px solid transparent`.
   - **Källfiler:** `src/index.css`, `src/components/HomeScreen.tsx`, `src/components/MovieDetailScreen.tsx`, `src/components/admin/SchemaTab.tsx`.

2. **Genre-chip (`GenreChip` på `FilmerScreen.tsx` och datum-chip på mobil i `SchemaTab.tsx`)**
   - **Utseende:** `padding: 6px 14px` (`8px 16px` i `SchemaTab` mobil), `border-radius: 20px`, `font-size: 13px`.
   - **Tillstånd:**
     - **Inaktiv:** Bakgrund `rgba(255, 255, 255, 0.03)`, kantlinje `1px solid rgba(148, 163, 184, 0.2)`, text `#94A3B8`, `font-weight: 400`.
     - **Aktiv:** Bakgrund `rgba(229, 9, 20, 0.15)`, kantlinje `1px solid #E50914`, text `#E50914`, `font-weight: 600`.
   - **Källfiler:** `src/components/FilmerScreen.tsx`, `src/components/admin/SchemaTab.tsx`.

3. **Ålders-chip (`AgeChip` på `FilmerScreen.tsx`)**
   - **Utseende:** `padding: 5px 11px`, `border-radius: 6px`, `font-size: 12px`, `font-weight: 600`.
   - **Tillstånd:**
     - **Inaktiv:** Bakgrund `transparent`, kantlinje `1px solid rgba(148, 163, 184, 0.2)`, text `#94A3B8`.
     - **Aktiv:** Bakgrund `#E50914`, kantlinje `1px solid #E50914`, text `#ffffff`.
   - **Källfil:** `src/components/FilmerScreen.tsx`.

4. **Visningstids-pill (Screening Pill på filmkort)**
   - **Utseende på `HomeScreen.tsx` (klickbara `button`):** `padding: 6px 10px` (`px-2.5 py-1.5`), `border-radius: 8px`, `font-size: 12px`, `font-weight: 500`. Visar `{time} · Stora` eller `{time} · Lilla`.
     - **Normalt tillstånd (`seatsLeft >= 10`):** Bakgrund `rgba(255, 255, 255, 0.07)`, kantlinje `1px solid rgba(255, 255, 255, 0.1)`, text `#F8FAFC`.
     - **Få platser kvar (`seatsLeft < 10`):** Bakgrund `rgba(229, 9, 20, 0.15)`, kantlinje `1px solid rgba(229, 9, 20, 0.3)`, text `#ff6b6b`, samt tilläggstext `({seatsLeft} kvar)` med `opacity: 0.7`.
   - **Utseende på `FilmerScreen.tsx` (icke-klickbara `span`):** `padding: 4px 9px`, `border-radius: 6px`, `font-size: 12px`, `font-weight: 500`. Visar endast `{time}`. Vid `seatsLeft < 10`: bakgrund `rgba(229, 9, 20, 0.15)`, kantlinje `1px solid rgba(229, 9, 20, 0.3)`, text `#E50914`; annars bakgrund `rgba(255, 255, 255, 0.06)`, kantlinje `1px solid rgba(148, 163, 184, 0.15)`, text `#F8FAFC`.
   - **Källfiler:** `src/components/HomeScreen.tsx`, `src/components/FilmerScreen.tsx`.

### 3.3 Badges och Märkningar

| Typ | Utseende & Färger | Textformat | Källfil |
| :--- | :--- | :--- | :--- |
| **Åldersbadge (`HomeScreen`)** | Övre vänstra hörnet på poster (`top: 12px`, `left: 12px`), `padding: 2px 8px`, `border-radius: 4px`, `font-size: 12px`, `font-weight: 700`, vit text. Bakgrund: `#10B981` om `Alla`, annars `#E50914`. | `Alla` eller `{ageRating} år` | `src/components/HomeScreen.tsx` |
| **Åldersbadge (`FilmerScreen`)** | Övre vänstra hörnet på poster (`top: 10px`, `left: 10px`), `padding: 3px 7px`, `border-radius: 5px`, `font-size: 11px`, `font-weight: 700`, vit text. Bakgrund: `#10B981` om `Alla`, `#E50914` om `15`, `#F59E0B` för övriga (`7`, `11`). | `{ageRating}` (utan "år") | `src/components/FilmerScreen.tsx` |
| **Åldersbadge (`FilmarkivTab`)** | `padding: 2px 8px`, `border-radius: 9999px` (desktop) / `5px` (mobil), `font-size: 12px` (`11px` mobil), `font-weight: 700`. Om `Alla`: bakgrund `rgba(16, 185, 129, 0.15)`, text `#10B981`. Annars: bakgrund `rgba(229, 9, 20, 0.12)`, text `#ff6b6b`. | `Alla` eller `{ageRating} år` | `src/components/admin/FilmarkivTab.tsx` |
| **Speltidsbadge på poster** | Övre högra hörnet (`top: 10px`, `right: 10px`), `padding: 3px 7px`, `border-radius: 5px`, `font-size: 11px`, `font-weight: 500`, bakgrund `rgba(0, 0, 0, 0.7)`, `backdrop-filter: blur(4px)`, text `rgba(255, 255, 255, 0.85)`. | `{runtime}` | `src/components/FilmerScreen.tsx` |
| **Premiärbanderoll** | Ligger överst över hela posterbredden (`padding: 8px 10px`), bakgrund `linear-gradient(135deg, #D97706 0%, #F59E0B 100%)`, `font-size: 10px`, `font-weight: 700`, `Poppins`, vit text, `letter-spacing: 0.08em`. | `PREMIÄR {PREMIEREDATE}` | `src/components/FilmerScreen.tsx` |
| **Genre-pills** | Hero (`HomeScreen`): `rgba(255, 255, 255, 0.12)`, text `#F8FAFC`, `uppercase`, `rounded-full`. Kort (`HomeScreen`): `rgba(255, 255, 255, 0.06)`, text `#94A3B8`, `rounded-full`. Kort (`FilmerScreen`): `rgba(255, 255, 255, 0.06)`, text `#94A3B8`, `border-radius: 4px`. | `{genre}` | `src/components/HomeScreen.tsx`, `src/components/FilmerScreen.tsx` |
| **Salongsbadge (`SchemaTab`)** | `padding: 4px 10px` (`2px 8px` mobil), `border-radius: 8px` (`5px` mobil), `font-size: 12px` (`11px` mobil), `font-weight: 600`. `Salong 1`: bakgrund `rgba(229, 9, 20, 0.12)`, text `#ff6b6b`. `Salong 2`: bakgrund `rgba(59, 130, 246, 0.12)`, text `#60A5FA`. | `Salong 1` / `Salong 2` | `src/components/admin/SchemaTab.tsx` |
| **Statusbadge (Bokning)** | `border-radius: 20px` / `9999px`, `font-size: 11px`–`12px`, `font-weight: 600`. `Betald`: bakgrund `rgba(16, 185, 129, 0.15)`, text `#10B981`. `Inväntar`: bakgrund `rgba(245, 158, 11, 0.15)`, text `#F59E0B`. | `Betald` / `Inväntar` | `src/components/admin/BokningarTab.tsx` |
| **Statusbadge (Visning)** | `border-radius: 20px` / `9999px`, `font-size: 11px`–`12px`. `Aktiv`: bakgrund `rgba(16, 185, 129, 0.15)`, text `#10B981`. `Inställd`: bakgrund `rgba(153, 27, 27, 0.2)` (desktop) / `rgba(229, 9, 20, 0.12)` (mobil), text `#ff6b6b`. | `Aktiv` / `Inställd` | `src/components/admin/SchemaTab.tsx` |
| **IMDb-betyg (`StarRating`)** | Gul stjärnikon (`13×13px`, `#F59E0B`), betyg i `JetBrains Mono` (`13px`, `font-weight: 600`, `#F59E0B`) med 1 decimal, följt av `IMDb` (`12px`, `#94A3B8`). | `{rating.toFixed(1)} IMDb` | `src/components/FilmerScreen.tsx` |

### 3.4 Kort (Cards)

1. **Filmkort (`HomeScreen.tsx` och `FilmerScreen.tsx`)**
   - **Yta:** Bakgrund `#161F30` (`var(--card)`), kantlinje `1px solid rgba(148, 163, 184, 0.15)`, `border-radius: 16px`, `overflow: hidden`.
   - **Bilddel:** Proportion `2:3` (`aspect-[2/3]` eller `padding-bottom: 150%`), bild med `object-fit: cover` som skalar till `1.05` vid hover.
   - **Hover-effekt på kortet:** `transform: translateY(-4px)` och `box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4)` (`HomeScreen`) respektive `0 12px 32px rgba(0, 0, 0, 0.4)` (`FilmerScreen`).
   - **Skillnad mellan sidorna:** På `HomeScreen.tsx` visas speltid och regissör samt klickbara visnings-pills; hela kortet är klickbart. På `FilmerScreen.tsx` visas speltidsbadge på postern, IMDb-betyg, icke-klickbara visningstider och en primärknapp `Köp biljetter`.
   - **Källfiler:** `src/components/HomeScreen.tsx`, `src/components/FilmerScreen.tsx`.

2. **Kommande premiär-kort (`UpcomingCard` i `FilmerScreen.tsx`)**
   - **Layout:** Horisontellt 2-kolumnskort (`grid-template-columns: 140px 1fr`), bakgrund `#161F30`, kantlinje `1px solid var(--border)`, `border-radius: 16px`.
   - **Innehåll:** Vänster kolumn med poster (`min-height: 200px`) och orange premiärbanderoll. Höger kolumn (`padding: 20px`) med IMDb-betyg, titel, originaltitel/speltid/regissör, genre- och ålders-taggar, trunkerad synopsis (160 tecken + `…`), 3 skådespelar-pills samt knapparna `Se Trailer` och `Bli påmind vid biljettsläpp` (som vid klick växlar till grön `Påminnelse aktiv`).
   - **Källfil:** `src/components/FilmerScreen.tsx`.

3. **Bokningskort (`MyBookingsScreen.tsx`, `ProfilScreen.tsx`, `BokningarTab.tsx`)**
   - **Mina Sidor (`MyBookingsScreen.tsx`):** Kort med grön toppremsa (`background: rgba(16, 185, 129, 0.08)`, `border-bottom: 1px solid rgba(16, 185, 129, 0.15)`) med texten `Kommande föreställning` till vänster och bokningskod till höger. Innehållsdel (`padding: 20px`) med poster (`56×84px`), titel, salong + tid, platser, totalpris samt knapparna `Visa biljett` och `Avboka`.
   - **Min Profil (`ProfilScreen.tsx`):** Kort (`padding: 20px`) med poster (`56×84px`), titel, tid + salong, röd bokningskodsbadge, grön badge `Bekräftad` och en `60×60px` stiliserad QR-rutnätsikon till höger.
   - **Admin mobilkort (`BookingCard` i `BokningarTab.tsx`):** Kort (`border-radius: 14px`, `padding: 16px`) med bokningskod, statusbadge (`Betald`/`Inväntar`), 2-kolumns infogrid (`Kund`, `Salong`, `Film & Tid`, `Belopp`, `Platser`) och fullbredds touchknappar (`Markera betald` / `✓ Betald` samt `Avboka`).
   - **Källfiler:** `src/components/MyBookingsScreen.tsx`, `src/components/ProfilScreen.tsx`, `src/components/admin/BokningarTab.tsx`.

4. **KPI-kort (`BokningarTab.tsx`)**
   - **Utseende:** Bakgrund `#161F30`, kantlinje `1px solid var(--border)`, `border-radius: 16px` (desktop, `padding: 20px`) / `14px` (mobil, `padding: 14px`).
   - **Indikator:** På desktop en `40×40px` rundad ruta (`border-radius: 12px`) med 12,5 % tonad bakgrund (`${color}20`); på mobil en `8×8px` färgad cirkel (`#3B82F6`, `#10B981`, `#F59E0B`).
   - **Källfil:** `src/components/admin/BokningarTab.tsx`.

### 3.5 Tabeller / Datarader (Admin Desktop)

- **Utseende:** Container med bakgrund `#161F30`, kantlinje `1px solid var(--border)`, `border-radius: 16px`, `overflow: hidden`.
- **Tabellhuvud:** CSS Grid-rad med `padding: 12px 20px`, `background: rgba(255, 255, 255, 0.02)`, `border-bottom: 1px solid var(--border)`, `font-size: 12px`, `font-weight: 600`, `uppercase`, `letter-spacing: 0.05em`, text `#94A3B8`.
- **Datarader:** CSS Grid-rader med `padding: 16px 20px`, `border-bottom: 1px solid var(--border)` (utom sista raden), hover-bakgrund `rgba(255, 255, 255, 0.015)`.
- **Kolumnmallar:**
  - `BokningarTab.tsx`: `110px 1fr 120px 80px 1fr 100px 110px`
  - `SchemaTab.tsx`: `80px 80px 110px 1fr 60px 90px 80px 80px 140px`
  - `FilmarkivTab.tsx`: `52px 1fr 80px 80px 1fr 80px 160px`
- **Responsivt beteende:** Vid `< 768px` (`useIsMobile`) ersätts tabellerna helt av staplade kort (`BookingCard`, visningskort, filmkort).
- **Källfiler:** `src/components/admin/BokningarTab.tsx`, `src/components/admin/SchemaTab.tsx`, `src/components/admin/FilmarkivTab.tsx`.

### 3.6 Formulär och Inmatningsfält

- **Textfält, `select` och `textarea`:**
  - Bakgrund: `rgba(255, 255, 255, 0.04)` till `0.06`.
  - Kantlinje: `1px solid rgba(148, 163, 184, 0.15)` (eller `rgba(255, 255, 255, 0.12)` i `SeatSelectionScreen.tsx`).
  - Hörnradie: `8px` (`ProfilScreen.tsx`), `10px` (`FilmerScreen.tsx`, `FilmarkivTab.tsx`, `SchemaTab.tsx`) eller `12px` (`SeatSelectionScreen.tsx`, `BokningarTab.tsx`, `SalongerAdminTab.tsx`).
  - Text: `#F8FAFC`, `font-size: 14px`, `Inter` (`JetBrains Mono` för tidsfält i `SchemaTab.tsx`). `<option>`-element i `<select>` har `background: #161F30`.
  - Fokus: `outline: 2px solid #E50914`, `outline-offset: 2px` (`src/index.css`).
- **Etiketter (`label`):** `font-size: 11px`–`12px`, `font-weight: 500`–`600`, text `#94A3B8`, ofta `uppercase` med `letter-spacing: 0.05em`–`0.07em`.
- **Sökfält med ikon:** Förstoringsglasikon (`16×16px`, `#94A3B8`) absolutpositionerad till vänster (`left: 12px`–`14px`), fält med vänsterpadding `36px`–`40px`.
- **Lösenordsfält med visa/dölj och styrkemätare (`PasswordStrength` i `ProfilScreen.tsx`):**
  - Ögonikon till höger (`18×18px`, `#94A3B8`) växlar mellan `type="password"` och `type="text"`.
  - Styrkemätare visas när nytt lösenord inte är tomt: 4 horisontella segment (`height: 3px`, `gap: 4px`, `border-radius: 2px`) + etikett under (`12px`). Poäng (1–4) beräknas utifrån: längd >= 8, versal `[A-Z]`, siffra `[0-9]`, specialtecken `[^A-Za-z0-9]`.
  - Nivåer: `1 = Svagt` (`#EF4444`), `2 = Okej` (`#F59E0B`), `3 = Starkt` (`#10B981`), `4 = Mycket starkt` (`#10B981`). Ouppfyllda segment har `rgba(148, 163, 184, 0.2)`.
- **Källfiler:** `src/index.css`, `src/components/FilmerScreen.tsx`, `src/components/SeatSelectionScreen.tsx`, `src/components/ProfilScreen.tsx`, `src/components/admin/BokningarTab.tsx`, `src/components/admin/SchemaTab.tsx`, `src/components/admin/FilmarkivTab.tsx`, `src/components/admin/SalongerAdminTab.tsx`.

### 3.7 Modaler och BottomSheets

1. **Centrerad modal (Desktop & Mobil)**
   - **Backdrop:** `position: fixed`, `inset: 0`, mörk övertoning (`rgba(0, 0, 0, 0.7)` i `MyBookingsScreen.tsx`, `rgba(0, 0, 0, 0.75)` med `backdrop-filter: blur(4px)` i admin, `rgba(0, 0, 0, 0.85)` med `backdrop-filter: blur(8px)` i `TrailerModal`). Klick på backdrop stänger modalen.
   - **Modal-kort:** Bakgrund `#161F30`, kantlinje `1px solid var(--border)` (eller `rgba(255, 255, 255, 0.1)`), `border-radius: 16px` (`20px` för `TrailerModal`).
   - **Källfiler:** `src/components/FilmerScreen.tsx`, `src/components/MyBookingsScreen.tsx`, `src/components/admin/SchemaTab.tsx`, `src/components/admin/FilmarkivTab.tsx`, `src/components/admin/SalongerAdminTab.tsx`.

2. **Mobilt BottomSheet (`SchemaTab.tsx` och `FilmarkivTab.tsx` vid `< 768px`)**
   - **Backdrop:** `position: fixed`, `inset: 0`, `z-index: 200`, `background: rgba(0, 0, 0, 0.7)`, `backdrop-filter: blur(4px)`.
   - **Panel:** `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `z-index: 201`, bakgrund `#161F30`, `border-radius: 20px 20px 0 0`, `border: 1px solid rgba(148, 163, 184, 0.15)` (utan nederkant), `max-height: 92vh` (`SchemaTab`) / `94vh` (`FilmarkivTab`), `overflow-y: auto`.
   - **Animation och handtag:** Glider in nedifrån med `transform: translateY(0)` / `translateY(100%)` (`transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)`). Överst finns ett centrerat draghandtag (`36×4px`, `border-radius: 2px`, `background: rgba(148, 163, 184, 0.3)`).
   - **Källfiler:** `src/components/admin/SchemaTab.tsx`, `src/components/admin/FilmarkivTab.tsx`.

### 3.8 Tabbar (flikkomponenter)

Prototypen innehåller fem varianter av tabb-navigering:
1. **Understrukna textflikar (`FilmerScreen.tsx`):** `På bio nu` och `Kommande premiärer` (med gul räknarbadge `4`). Aktiv flik har `border-bottom: 2px solid #E50914`, text `#F8FAFC`, `font-weight: 700` (`Poppins`).
2. **Segmenterad pill-box (`MyBookingsScreen.tsx` och `ProfilScreen.tsx` mobil):** Container i `#161F30` med `padding: 4px`. I `MyBookingsScreen.tsx` har aktiv flik bakgrund `rgba(255, 255, 255, 0.1)`; i `ProfilScreen.tsx` (mobil) har aktiv flik bakgrund `#E50914` och vit text.
3. **Vertikal sidomeny med vänsterkant (`ProfilScreen.tsx` desktop):** Staplade knappar i `#161F30`-kort. Aktiv flik har `border-left: 3px solid #E50914`, bakgrund `rgba(229, 9, 20, 0.06)`, text `#F8FAFC` och `font-weight: 600`.
4. **Fristående knappflikar (`ProfilScreen.tsx` underflikar under Bokningshistorik):** `Kommande visningar` (aktiv: bakgrund `#E50914`, vit text) och `Tidigare besök` (inaktiv: bakgrund `#161F30`, text `#94A3B8`).
5. **Admin-toppflikar (`AdminScreen.tsx`):**
   - **Desktop:** Ikon + fullständig etikett (`padding: 8px 14px`, `border-radius: 8px 8px 0 0`). Aktiv flik har bakgrund `rgba(229, 9, 20, 0.12)`, text `#ff6b6b` och `border-bottom: 2px solid #E50914`.
   - **Mobil:** Andra rad i toppbaren med staplad ikon + kort etikett (`Bokningar`, `Schema`, `Filmer`, `Salonger`), `font-size: 10px`. Aktiv flik har text `#E50914` och `border-bottom: 2px solid #E50914`.

### 3.9 Toasts och Inline-feedback

Prototypen använder inga flytande toast-komponenter, utan ger direkt återkoppling inline vid knappen:
- **Kopiera bokningskod (`BookingConfirmScreen.tsx`):** Knappen `Kopiera` växlar under 2 sekunder till grön bakgrund `rgba(16, 185, 129, 0.15)`, text `#10B981`, bockikon och texten `Kopierat`.
- **Spara profiluppgifter (`ProfilScreen.tsx`):** Till höger om knappen `Spara ändringar` visas under 2,5 sekunder en grön bockikon (`16×16px`) och texten `Sparat!` i `#10B981`.
- **Spara film i admin (`FilmarkivTab.tsx`):** Knappen `Spara film` ändrar bakgrund till `#10B981` och text till `Sparad!` med bockikon under 2 sekunder innan modalen stängs.

### 3.10 Platskarta (Seat Map)

Det finns fyra varianter av salongskarta i prototypen:

1. **Publik interaktiv platskarta (`SeatSelectionScreen.tsx` och `src/index.css`)**
   - **Bioduk:** Kurvad båge överst (`width: 80%`, `height: 40px`, `border-radius: 50% 50% 0 0 / 20px 20px 0 0`, `background: linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.03))`, `border: 1px solid rgba(255,255,255,0.15)` utan nederkant) med texten `BIODUK` (`font-size: 12px`, `letter-spacing: 0.25em`, `rgba(255,255,255,0.5)`), följt av en `24px` hög projektionsglöd (`linear-gradient(to bottom, rgba(255,255,200,0.06), transparent)`).
   - **Matris:** 10 rader (`A`–`J`) × 12 stolar per rad (`1`–`12`), omsluten av en horisontellt scrollbar container (`overflow-x: auto`). Varje rad har radbokstaven i `JetBrains Mono` (`12px`, `#94A3B8`, bredd `20px`) på både vänster och höger sida. Avstånd mellan stolar: `4px` (`gap-1`), avstånd mellan rader: `6px` (`mb-1.5`).
   - **Stolselement (`.seat`):** `28×26px`, `border-radius: 6px 6px 3px 3px`, `title="Rad {row}, Stol {seatNum}"` (eller `"Upptagen"`).
     - **Ledig (`.seat-available`):** Bakgrund `#334155`. Vid hover: `transform: scale(1.15)`.
     - **Vald (`.seat-selected`):** Bakgrund `#10B981`, skugga `0 0 10px rgba(16, 185, 129, 0.5)`. Vid hover: `transform: scale(1.15)`.
     - **Upptagen (`.seat-occupied`):** Bakgrund `#1E293B`, `opacity: 0.4`, `cursor: not-allowed`, med diagonal vit linje via `::after` (`linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.3) 60%, transparent 60%)`).
   - **Legend:** Tre indikatorer (`20×16px` rundade rutor + etikett i `12px` `#94A3B8`): `Ledig` (`#334155`), `Vald` (`#10B981` med glöd), `Upptagen` (`#1E293B` med `opacity: 0.4`). Ingen rullstolsmarkering finns i den publika bokningskartan.

2. **Mini-salongskarta på Salonger-sidan (`MiniAuditoriumMap` i `SalongerScreen.tsx`)**
   - Icke-interaktiv översiktskarta med liten `BIODUK`-båge, stolrutor på `10×9px` (`border-radius: 3px 3px 2px 2px`) och legend: `Ledig` (`#334155`), `Exempelval` (`#E50914` för Salong 1, `#10B981` för Salong 2, visas på rad 4 stol 3–5), samt `Rullstol` (`#3B82F6`, visas på ytterplatserna i sista raden). Första raden har `opacity: 0.5`.

3. **Admin Live-salongskarta (`MiniSeatMap` i `BokningarTab.tsx`)**
   - Icke-interaktiv `8×10`-matris i höger sidopanel på desktop med stolrutor på `9×8px` (`border-radius: 2px 2px 1px 1px`).
   - Legend och färger: `Ledig` (`#334155`), `Bokad` (`#E50914` med `opacity: 0.5`), `Inväntar` (`#10B981`).

4. **Admin Salongsförhandsgranskning (`SeatPreviewGrid` i `SalongerAdminTab.tsx`)**
   - Visas både på salongskorten och som live-förhandsgranskning i modalen (begränsad till max 10 rader × 16 stolar i modalen).
   - Visar radbokstav (`A`, `B`, …) till vänster och antal stolar per rad till höger i `JetBrains Mono` (`9px`). Stolrutor `14×12px` med `Ledig` (`#334155`) och `Rullstol` (`#3B82F6` på första och sista stolen i rad A).

### 3.11 Antal-väljare (Steppers & Progress Stepper)

1. **Biljetträknare (`TicketCounter` i `SeatSelectionScreen.tsx`)**
   - Rad med biljettyp (`#F8FAFC`, `14px`, `font-weight: 500`) och pris (`#94A3B8`, `14px`) till vänster, samt `−`, antal och `+` till höger.
   - Knappar (`−` och `+`): Cirkulära (`32×32px`, `border-radius: 9999px`), bakgrund `rgba(255, 255, 255, 0.08)`, teckenstorlek `18px`. Vid `count === 0` är `−` `disabled` med textfärg `#94A3B8`. Maxvärde per biljettyp är `8`.
2. **Rader/Stolar-stepper (`SalongerAdminTab.tsx`)**
   - Runda/kvadratiska knappar (`28×28px`, `border-radius: 8px`, bakgrund `rgba(255, 255, 255, 0.08)`) inuti en `rgba(255, 255, 255, 0.05)`-container. Minvärde `1`, maxvärde `20`.
3. **Stegindikator (`StepIndicator` i `SeatSelectionScreen.tsx`)**
   - Visar 3 steg: `1. Biljetter` — `2. Välj platser` — `3. Bekräftelse`.
   - Cirkel (`28×28px`, `font-size: 12px`, `font-weight: 700`):
     - **Aktivt steg:** Bakgrund `#E50914`, vit siffra, etikett i `#F8FAFC`.
     - **Avklarat steg:** Bakgrund `#10B981`, vit bockikon, linje till nästa steg i `#10B981`.
     - **Kommande steg:** Bakgrund `rgba(255, 255, 255, 0.08)`, siffra och etikett i `#94A3B8`, linje i `rgba(255, 255, 255, 0.1)`.
   - Etiketterna döljs på skärmar `< 640px` (`hidden sm:block`).

### 3.12 Cookie-banner (`CookieBanner.tsx`)

- **Placering och yta:** Fast längst ned (`position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `z-index: 50`), `padding: 16px` (`24px` på `>= 640px`), bakgrund `linear-gradient(to top, rgba(11, 15, 25, 0.98) 0%, rgba(11, 15, 25, 0.9) 100%)`, `backdrop-filter: blur(20px)`, `border-top: 1px solid rgba(255, 255, 255, 0.08)`. Visas på alla publika vyer tills användaren stänger den (`showCookie` i `App.tsx`).
- **Innehåll (maxbredd `896px`):**
  - **Ikon:** `40×40px` rundad ruta (`border-radius: 12px`, bakgrund `rgba(229, 9, 20, 0.15)`) med röd kak-ikon (`20×20px`, `#E50914`).
  - **Rubrik:** `Vi använder cookies` (`14px`, `font-weight: 600`, `#F8FAFC`).
  - **Brödtext:** `Nödvändiga cookies används för autentisering och sessionshantering. Analytiska cookies hjälper oss förbättra upplevelsen.` (`12px`, `#94A3B8`) följt av en understruken toggle-knapp i `#F8FAFC` med texten `Anpassa` (i hopfällt läge) eller `Dölj inställningar` (i utfällt läge).
  - **Utfällt läge (`expanded === true`):** Visar två rader med toggle-switchar (`40×24px`, `border-radius: 9999px`, vit cirkel `16×16px`):
    1. `Nödvändiga cookies` / `Alltid aktiva` — låst i aktivt läge (bakgrund `#10B981`, cirkel till höger).
    2. `Statistik & Analys` / `Valfritt` — klickbar toggle (`analyticsEnabled`, inaktiv bakgrund `rgba(255, 255, 255, 0.12)` med cirkel till vänster; aktiv bakgrund `#10B981` med cirkel till höger).
  - **Knappar till höger (`padding: 10px 16px`, `border-radius: 12px`, `font-size: 12px`):**
    - `Anpassa` (visas endast när `expanded === true`, bakgrund `rgba(255, 255, 255, 0.08)`, text `#F8FAFC` — stänger bannern vid klick).
    - `Endast nödvändiga` (bakgrund `rgba(255, 255, 255, 0.08)`, kantlinje `1px solid rgba(255, 255, 255, 0.1)`, text `#F8FAFC` — stänger bannern vid klick).
    - `Acceptera alla` (bakgrund `#E50914`, vit text, `font-weight: 600` — stänger bannern vid klick).
- **Källfil:** `src/components/CookieBanner.tsx`.

