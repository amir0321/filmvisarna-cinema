> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Statusbadges, 3.4 Bokningskort & KPI-kort, 3.5 Tabeller, 3.6 Formulär, 3.8 Admin-flikar, 3.10 MiniSeatMap), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.10 Admin – Bokningar & Kassa (`BokningarTab` i `AdminScreen`)

- **Föreslagen route:** `/admin/bokningar` (Föreslagen)
- **Skärm-ID:** `'admin'` med `activeTab === 'bokningar'`
- **Källfiler:** `src/components/AdminScreen.tsx`, `src/components/admin/BokningarTab.tsx`, `src/components/admin/adminData.ts`

#### Sidhuvud i `AdminScreen`
- **Desktop (`>= 768px`):**
  - Rubrik (`h1`): `Bokningar & Kassa` (`22px`, `Poppins`, `font-weight: 700`).
  - Underrubrik: `Hantera dagens bokningar och kassa` (`13px`, `#94A3B8`).
  - Brödsmula till höger: `Backoffice` > `Bokningar & Kassa`.
- **Mobil (`< 768px`):**
  - Rubrik (`h2`): `Bokningar & Kassa` (`18px`, `Poppins`, `font-weight: 700`).
  - Underrubrik: `Hantera dagens bokningar` (`12px`, `#94A3B8`).

#### Struktur och komponenter i `BokningarTab`
1. **Snabb incheckning (Sökpanel):**
   - Rubrik (endast desktop): `Snabb incheckning` (`12px`, `uppercase`, `letter-spacing: 0.1em`, `#94A3B8`).
   - Sökfält med förstoringsglasikon:
     - Placeholder desktop: `Sök bokningsnummer (t.ex. FV-8K49P) eller kundens e-post…`
     - Placeholder mobil: `Sök bokningsnummer eller e-post…`
   - Primär knapp med bockikon: `Checka in` (`#E50914`).
2. **KPI-kort (3 st — 3 kolumner på desktop `grid-cols-3`, 2 kolumner på mobil där kort 3 spänner över full bredd `1 / -1`):**
   - Kort 1 (`#3B82F6`): `Dagens bokningar` — `{bookings.length} st` — `{pending} inväntar · {paid} betalda` (Exempeldata start: `8 st`, `4 inväntar · 4 betalda`).
   - Kort 2 (`#10B981`): `Förväntad intäkt` — `{(totalRevenue + pending * 300).toLocaleString('sv')} kr` — `{totalRevenue} kr betalt`.
   - Kort 3 (`#F59E0B`): `Beläggning` — `{occupancy}%` — `{soldSeats}/{totalSeats} platser` (Exempeldata: `78%`, `62/80 platser`).
3. **Visningsfilter:**
   - Etikett: `Filtrerar visning:` (desktop) / `Filtrerar visning` (mobil).
   - Dropdown (`<select>`) med 7 visningsalternativ i `SCREENING_OPTIONS` (Exempeldata, förvald: `Idag 18:00 — Stjärnornas Krig: Arvet, Salong 1`).
   - På desktop visas till höger en grön prick (`8×8px`, `#10B981`) och texten `Live`.
4. **Bokningslista (Tabell på desktop, kortlista på mobil):**
   - På mobil visas räknetexten `{filteredBookings.length} bokningar visas` ovanför korten.
   - **Tabellkolumner på desktop:** `Bokningsnr` | `Kund` | `Film & Tid` | `Salong` | `Platser / Biljetter` | `Belopp` | `Åtgärd`.
   - **Fält på mobilkort (`BookingCard`):** Bokningskod, statusbadge (`Betald`/`Inväntar`), `Kund`, `Salong`, `Film & Tid`, `Belopp`, `Platser` samt knapparna `Markera betald` (eller `✓ Betald`) och `Avboka`.
   - **Interaktioner:**
     - Klick på `Markera betald` sätter `status = 'paid'`, lägger till boknings-ID i `checkedIn` (vilket färgar bokningskodsbrickan grön `rgba(16, 185, 129, 0.15)` med `#10B981`-text) och uppdaterar KPI-korten.
     - Klick på `Avboka` tar bort bokningen direkt ur listan.
   - **Tomt tillstånd (`filteredBookings.length === 0`):** `Inga bokningar hittades.`
5. **Höger sidopanel (endast desktop, `width: 256px` / `w-64`):**
   - **Kort 1 – Live salongskarta:**
     - Rubrik: `Salongskarta — live`, underrubrik: `Salong 1 · 18:00 visning` (Exempeldata).
     - Renderar `MiniSeatMap` med legend: `Ledig` (`#334155`), `Bokad` (`#E50914`), `Inväntar` (`#10B981`).
     - Beläggningsmätare under avdelare: `Beläggning` / `{occupancy}%`, progressbar (`#E50914` om > 80 %, `#F59E0B` om > 50 %, annars `#10B981`) samt texten `{soldSeats} bokade · {totalSeats - soldSeats} lediga`.
   - **Kort 2 – Kassaöversikt:**
     - Rubrik: `Kassaöversikt`.
     - Rader:
       - `Kontant att ta emot`: `{summa pending} kr` (`#F59E0B`)
       - `Redan betalat`: `{totalRevenue} kr` (`#10B981`)
       - `Totalt idag`: `{total summa} kr` (`#F8FAFC`)

