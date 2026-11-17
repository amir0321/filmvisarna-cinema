> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Badges, 3.4 Kort, 3.6 Formulär, 3.7 Modaler, 3.8 Admin-flikar, 3.10 SeatPreviewGrid, 3.11 Rader/Stolar-stepper), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.13 Admin – Salonger (`SalongerAdminTab` / `AdminCinemas.tsx`)

- **Föreslagen route:** `/admin/salonger` (Föreslagen)
- **Skärm-ID:** `'admin'` med `activeTab === 'salonger'`
- **Källfiler:** `src/components/AdminScreen.tsx`, `src/components/admin/SalongerAdminTab.tsx`, `src/components/admin/adminData.ts`

#### Bindande krav för tema (mörkt/ljust), backend-regler och översättning (`sv` / `en`)

När `/admin/salonger` (`AdminCinemas.tsx`) byggs ut från nuvarande platshållare gäller följande krav:
- **Backend- och domänregler:**
  - Biografen har i standardutförande två salonger: **Stora Salongen** (8 rader A–H × 10 stolar = 80 platser) och **Lilla Salongen** (5 rader A–E × 8 stolar = 40 platser).
  - Enligt backend-kontraktet (`POST /api/cinemas` / `PUT /api/cinemas/:id`) kan rader (`1–26`) och stolar per rad (`1–50`) endast anges när en ny salong skapas; vid redigering av en befintlig salong kan namn, teknik/format och rullstolsplatser uppdateras medan rader/stolar är låsta. Borttagning (`DELETE /api/cinemas/:id`) av salong med visningar returnerar `409` och ska visa en tydlig förklaring.
- **Mörkt och ljust tema (`dark` / `light`, FE-36):**
  - Fasta hex-värden nedan (`#161F30`, `#ff6b6b`, `#334155`, `#3B82F6`) avser prototypens mörka tema.
  - Implementationen **måste** använda semantiska tokens från [design/tokens.md](../tokens.md): `$fv-card-bg` (`--color-surface`), `$fv-muted-bg` (`--color-surface-muted`), `$fv-fg` (`--text-primary`), `$fv-muted-fg` (`--text-muted`), `$fv-border` (`--border-default`), `--seat-available-bg` / `--seat-available-border`, `$fv-info` och `tint(...)` / `$white-overlay-*`. Alla ytor, `SeatPreviewGrid`, badges och `Modal` / `BottomSheet` ska hålla WCAG AA-kontrast (`>= 4,5:1`) i både mörkt och ljust tema.
- **Svensk och engelsk översättning (`sv` / `en`):**
  - Alla synliga texter, brödsmulor (`AdminPageHeader`), etiketter, knappar, modalrubriker, fel-/tomtillstånd och `aria-label`-attribut ska stödja både svenska (`sv`) och engelska (`en`) via det gemensamma översättningssystemet:
    - Sidhuvud: `Salonger` / `Auditoriums`, underrubrik `Konfigurera salonger och sittplatser` / `Configure auditoriums and seating`, brödsmula `Backoffice › Salonger` / `Backoffice › Auditoriums`.
    - Sektionshuvud: `Biografens Salonger` / `Cinema Auditoriums`, `{count} salonger · {totalSeats} platser totalt` / `{count} auditoriums · {totalSeats} seats total`, knapp `Lägg till ny salong` / `Add new auditorium`.
    - Kort & statistik: `{seats} platser` / `{seats} seats`, `Rader` / `Rows`, `Stolar/rad` / `Seats/row`, `Format` / `Format`, `Teknik` / `Tech`, `Salongskarta — numrering höger till vänster` / `Seating map — numbered right to left`, legend `Ledig` / `Available`, `Rullstol` / `Wheelchair`, `Rullstolsplatser: {wheelchair}` / `Wheelchair seats: {wheelchair}`.
    - Åtgärder & modal: `Redigera salong` (eller `Redigera rader & stolar`) / `Edit auditorium`, `Ta bort` / `Delete`, inline-bekräftelse `Bekräfta` / `Confirm` och `Avbryt` / `Cancel`, fält `Salongsnamn` / `Auditorium name`, `Antal rader` / `Number of rows`, `Stolar per rad` / `Seats per row`, `Teknik / Format` / `Tech / Format`, `Rullstolsanpassade platser` / `Wheelchair-accessible seats`, `Live förhandsgranskning` / `Live preview`, `Spara salongskonfiguration` / `Save auditorium configuration`.

#### Sidhuvud i `AdminScreen`
- **Desktop (`>= 768px`):** Rubrik `Salonger`, underrubrik `Konfigurera salonger och sittplatser`, brödsmula `Backoffice` > `Salonger`.

#### Struktur och komponenter i `SalongerAdminTab`
1. **Sektionshuvud:**
   - Vänster: Rubrik `Biografens Salonger` (`20px`, `Poppins`, `font-weight: 700`) och undertill `{salonger.length} salonger · {totalSeats} platser totalt` (Exempeldata: `2 salonger · 120 platser totalt`).
   - Höger: Primär knapp `Lägg till ny salong` (med plusikon).
2. **Salongskort-grid (`grid-cols-1 lg:grid-cols-2`, `gap: 24px`):**
   - Varje salongskort (`#161F30`, `border-radius: 16px`, `border: 1px solid var(--border)`) innehåller:
     - **Korthuvud:** `{name}` (`Salong 1` / `Salong 2`), `{fullName}` (`Stora Salongen` / `Lilla Salongen`) och röd badge `{rows * seatsPerRow} platser` (`rgba(229, 9, 20, 0.12)`, text `#ff6b6b`).
     - **Statistikrad (4 kolumner med vertikal kantlinje):** `Rader` (`8` / `5`), `Stolar/rad` (`10` / `8`), `Format` (`2D+` / `2D`), `Teknik` (`4K` / `Digital`).
     - **Salongskarta:** Rubrik `Salongskarta — numrering höger till vänster` följt av `SeatPreviewGrid` med radbokstäver till vänster, stolsantal till höger och legend (`Ledig`, `Rullstol`).
     - **Format & rullstolsrad:** Format-badges (`2D`, `4K`, `Dolby Atmos`) samt blå rullstolsikon med texten `Rullstolsplatser: {wheelchair}` (Exempeldata: `Rad A: Stol 1, 10` respektive `Rad A: Stol 1, 8`).
     - **Åtgärdsknappar:**
       - `Redigera rader & stolar` (sekundär knapp med pennikon, öppnar modalen).
       - `Ta bort` (röd sekundärknapp med papperskorgsikon, visar vid klick inline-knapparna `Bekräfta` och `Avbryt`).
3. **Modal: `Lägg till ny salong` / `Redigera salong` (`showModal === true`):**
   - Centrerad modal (`max-width: 512px`, används på både desktop och mobil i denna flik).
   - **Rubrik:** `Lägg till ny salong` eller `Redigera salong`.
   - **Formulärfält:**
     1. `Salongsnamn` — placeholder: `t.ex. "Salong 3 — VIP"`
     2. `Antal rader` — stepper `−` / `+` (min `1`, max `20`, standard `8`)
     3. `Stolar per rad` — stepper `−` / `+` (min `1`, max `20`, standard `10`)
     4. `Teknik / Format` — multi-select kryssknappar för `2D`, `3D`, `Dolby Atmos`, `4K Laser` (valda alternativ får röd bakgrund `rgba(229, 9, 20, 0.12)`, röd kantlinje och text `#ff6b6b`).
     5. `Rullstolsanpassade platser` — placeholder: `t.ex. Rad A: Stol 1, 10`
     6. **Live förhandsgranskning:** Kort med rubrik `Live förhandsgranskning`, röd pill-badge `{totalCapacity} platser totalt` och `SeatPreviewGrid`.
   - **Footer-knappar:** `Avbryt` och `Spara salongskonfiguration`.

