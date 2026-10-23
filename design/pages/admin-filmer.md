> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Åldersbadges, 3.5 Tabeller, 3.6 Formulär, 3.7 Modaler & BottomSheets, 3.8 Admin-flikar, 3.9 Inline-feedback), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.12 Admin – Filmarkiv (`FilmarkivTab` i `AdminScreen`)

- **Föreslagen route:** `/admin/filmer` (Föreslagen)
- **Skärm-ID:** `'admin'` med `activeTab === 'filmarkiv'`
- **Källfiler:** `src/components/AdminScreen.tsx`, `src/components/admin/FilmarkivTab.tsx`, `src/components/admin/adminData.ts`

#### Sidhuvud i `AdminScreen`
- **Desktop (`>= 768px`):** Rubrik `Filmarkiv`, underrubrik `Lägg till, redigera och ta bort filmer i repertoaren`, brödsmula `Backoffice` > `Filmarkiv`.
- **Mobil (`< 768px`):** Rubrik `Filmarkiv` (`18px`).

#### Struktur och komponenter i `FilmarkivTab`
1. **Verktygsrad:**
   - **Sökfält:** Placeholder `Sök filmtitel eller regissör…` (desktop) / `Sök film eller regissör…` (mobil).
   - **Antalsindikator:** `{filtered.length} filmer`.
   - **Primär CTA-knapp:** `Lägg till ny film` (desktop) / `+ Ny Film` (mobil).
2. **Filmlista (Tabell på desktop, kortlista på mobil):**
   - **Tabellkolumner på desktop:** `Affisch` | `Titel` | `Åldersgräns` | `Speltid` | `Regissör` | `Visningar` | `Åtgärder`.
   - **Data per rad/kort:** Affisch (`40×56px` desktop / `52×74px` mobil), titel + genrer separerade med ` · `, åldersbadge (`Alla` eller `{ageRating} år`), speltid i minuter (`{runtimeMin} min`), regissör, antal aktiva visningar (`{1..3} aktiva` på desktop), samt knapparna:
     - `Redigera` (öppnar modalen förifyllt med filmens data).
     - `Ta bort` (visar vid klick inline-knapparna `Bekräfta` och `Avbryt`; bekräftelse raderar filmen ur listan).
3. **Modal / BottomSheet: `Lägg till ny film` / `Redigera film` (`showModal === true`):**
   - Visas som centrerad modal på desktop (`max-width: 576px` / `max-w-xl`) och som `BottomSheet` på mobil.
   - **Rubrik:** `Lägg till ny film` (vid ny) eller `Redigera film` (vid redigering).
   - **Formulärfält:**
     1. `Filmtitel (Svenska)` — placeholder: `Filmens titel`
     2. `Originaltitel` — placeholder: `Original title`
     3. `Beskrivning / Synopsis` (`textarea`, 3 rader) — placeholder: `Beskriv filmens handling…`
     4. `YouTube Trailer URL` — placeholder: `https://youtube.com/watch?v=…`
     5. `Affisch-bild URL` — placeholder: `https://… (400×600)` (om ifyllt visas en förhandsgranskningsruta med `40×56px` bild och texten `Affischförhandsgranskning`).
     6. `Regissör` — placeholder: `Regissörens namn`
     7. `Åldersgräns` (`<select>`): `Barntillåten / Alla` (`value="Alla"`), `7 år` (`value="7"`), `11 år` (`value="11"`), `15 år` (`value="15"`).
     8. `Speltid (minuter)` (`type="number"`) — placeholder: `t.ex. 120`
     9. `Genre (kommaseparerat)` — placeholder: `Action, Drama…`
     10. `Skådespelare (kommaseparerat)` — placeholder: `Skådespelarnas namn, separerade med komma` (om ifyllt renderas runda preview-pills under fältet).
   - **Footer-knappar:** `Avbryt` och `Spara film` (växlar till grön `Sparad!` vid sparning).

