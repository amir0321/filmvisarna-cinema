> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips, 3.3 Salongs- & Statusbadges, 3.5 Tabeller, 3.6 Formulär, 3.7 Modaler & BottomSheets, 3.8 Admin-flikar), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.11 Admin – Visningsschema (`SchemaTab` i `AdminScreen`)

- **Föreslagen route:** `/admin/visningar` (Föreslagen)
- **Skärm-ID:** `'admin'` med `activeTab === 'schema'`
- **Källfiler:** `src/components/AdminScreen.tsx`, `src/components/admin/SchemaTab.tsx`, `src/components/admin/adminData.ts`

#### Sidhuvud i `AdminScreen`
- **Desktop (`>= 768px`):** Rubrik `Visningsschema`, underrubrik `Schemalägg och hantera filmvisningar`, brödsmula `Backoffice` > `Visningsschema`.
- **Mobil (`< 768px`):** Rubrik `Visningsschema` (`18px`).

#### Struktur och komponenter i `SchemaTab`
1. **Verktygsrad / Filter:**
   - **Datumchips:** `Idag`, `Imorgon`, `Hela veckan`.
   - **Primär CTA-knapp:**
     - Desktop (till höger i verktygsraden): `Schemalägg ny visning` (med plusikon).
     - Mobil (fullbredd ovanför datumchipsen): `+ Ny Visning` (med plusikon).
2. **Visningslista (Tabell på desktop, kortlista på mobil):**
   - **Tabellkolumner på desktop:** `Datum` | `Starttid` | `Salong` | `Film` | `Format` | `Sålda platser` | `Sluttid` | `Status` | `Åtgärder`.
   - **Sålda platser-indikator:** Visar `{soldSeats} / {totalSeats}` (desktop) respektive `Sålda platser` och `{soldSeats}/{totalSeats} ({pct}%)` (mobil), samt en horisontell progressbar (`#F59E0B` om `pct > 80`, `#10B981` om `pct > 50`, annars `#334155`).
   - **Statusbadge:** `Aktiv` (grön `#10B981`) eller `Inställd` (röd `#ff6b6b`, raden/kortet får `opacity: 0.5`).
   - **Åtgärdsknappar per rad/kort:**
     - `Redigera` (sekundär knapp med pennikon; ingen klick-handler i prototypen).
     - `Ställ in` (röd sekundärknapp med papperskorgsikon; vid klick visas inline-knapparna `Bekräfta` och `Avbryt`. Bekräftelse sätter `status = 'cancelled'`).
   - **Tomt tillstånd (`filtered.length === 0`):** `Inga visningar {dateFilter.toLowerCase()}.`
3. **Modal / BottomSheet: `Schemalägg ny visning` (`showModal === true`):**
   - Visas som centrerad modal på desktop (`max-width: 512px`) och som `BottomSheet` på mobil.
   - **Rubrik:** `Schemalägg ny visning`.
   - **Fält:**
     1. `Välj film`: Scrollbar lista (`max-height: 220px`) med alla filmer i `MOVIES` (visar liten poster `36×52px`, titel, `{runtime} · {Alla åldrar / X år}` och röd bockikon för vald film).
     2. `Välj salong`: 2 valbara kort i grid (`1fr 1fr`):
        - `Salong 1 — Stora` / `80 platser, 4K Laser`
        - `Salong 2 — Lilla` / `40 platser, 2D`
     3. `Datum` (`<select>`): `Idag`, `Imorgon`, `Lördag`, `Söndag`, `Måndag`.
     4. `Starttid` (`<input type="time">`, förifyllt `18:00`).
     5. **Grön informationsruta med klockikon:** `Beräknad sluttid: {autoEndTime} (inkl. 15 min)` (beräknas som `startTime + runtimeMin + 15` minuter).
   - **Footer-knappar:** `Avbryt` och `Publicera visning` (lägger till visningen sorterad på starttid).

