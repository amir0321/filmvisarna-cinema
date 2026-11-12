> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.2 Filter-chips, 3.3 Salongs- & Statusbadges, 3.5 Tabeller, 3.6 Formulär, 3.7 Modaler & BottomSheets, 3.8 Admin-flikar), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.11 Admin – Visningsschema (`AdminScreenings.tsx`)

- **Route:** `/admin/visningar`, med alias `/admin/schema` och `/admin/screenings`. Kräver administratör.
- **Aktuell implementation:** `Frontend/src/pages/admin/AdminScreenings.tsx`, `Frontend/src/components/admin/{AdminPageHeader,ScreeningsTable,ScreeningFormModal}.tsx`, `DatePickerPopover.tsx` och `Frontend/src/styles/components/admin/_admin-screenings.scss`.
- Beskrivningen gäller den implementerade appen och ersätter prototypens `SchemaTab`.

#### Gemensamt sidhuvud

- `AdminPageHeader` visar `Visningsschema` och `Schemalägg och hantera filmvisningar`.
- Brödsmulan `Backoffice › Visningsschema` ligger uppe till höger från `768px` och under rubrikblocket på mobil. `Backoffice` går till `/admin`, och aktuell sida har `aria-current="page"`.
- Filmarkivet använder samma komponent och placering. Se [layout §4.3](../layout.md#43-admin-navigering-samma-header-som-vanliga-hemsidan).

#### Filter och responsiv lista

- **Perioder:** `Alla kommande`, `Idag`, `Imorgon`, `Hela veckan`. `Välj datum` öppnar en kalender med tillgängliga visningsdagar. Ett valt datum ersätter periodfiltret; salongsvalet kan kombineras med båda.
- **Primär knapp:** `Schemalägg ny visning` med plusikon på alla skärmstorlekar.
- Filter kan radbrytas. Under `640px` ligger perioderna i två kolumner, medan datumknapp, salongsval och skapa-knapp får full bredd. Datumväljaren hålls inom skärmen.
- **Från `1200px` (Bootstrap `xl`):** Tabell med kolumnerna `Datum`, `Starttid`, `Salong`, `Film`, `Format`, `Sålda platser`, `Sluttid`, `Status`, `Åtgärder`. Kolumnbredder och radbrytning håller åtgärderna inom tabellen även vid långa filmtitlar.
- **Under `1200px`:** Kort med datum/status, filmtitel, tid, salong, format, sålda platser och samma åtgärder som tabellen. En kolumn under `768px`, två kolumner på surfplatta (`768–1199px`).
- **Beläggning:** Verkligt antal bokade platser / salongens totalantal samt progressbar, grön normalt och varningsfärgad från `90 %`. `Fullbokad` visas när inga platser återstår, annars `Aktiv`.
- **Åtgärder:** `Redigera` öppnar formuläret. `Ställ in` kräver inline-bekräftelse med `Ja, ställ in` / `Avbryt` och anropar API. Vid bokningar är knappen inaktiverad och texten `Visningen har bokningar och kan inte ställas in.` syns under knapparna.
- **Liststatus:** `1 visning` / `X visningar`, laddningsskelett, fel med återförsök och tomt tillstånd `Inga visningar`. `usePagination` och `Pagination` visar 15 visningar per sida efter filtrering.

#### Skapa och redigera visning

- `ScreeningFormModal` använder gemensam `Modal`, centrerad på desktop (`size="md"`, högst `560px`) och BottomSheet under `768px`. Rubrik `Schemalägg ny visning` eller `Redigera visning`.
- Välj film i skrollbar lista med affisch, titel, speltid och åldersgräns. Långa titlar får radbrytas.
- Välj en av backendens två salonger, Stora (80 platser) eller Lilla (40 platser), med verkligt format. Salongskorten staplas på smal mobil.
- Datum väljs i en lista för de närmaste 30 dagarna; en befintlig visnings datum bevaras även utanför intervallet. Starttid är ett tidsfält, förifyllt med `18:00` för ny visning.
- Datum och tid staplas på smala skärmar. Den gröna informationsrutan visar `Beräknad sluttid` inklusive **20 min städning** efter filmens speltid.
- Footer har `Avbryt` och `Publicera visning` / `Spara ändringar`. Knapparna staplas på smal mobil och ligger kvar när innehållet skrollas.
- Visningar med bokningar visar en informationsruta och låser salong, datum och tid. Filmen kan fortfarande redigeras enligt befintligt API.
- Serverfel visas på svenska utan att stänga formuläret; lyckad sparning stänger det, uppdaterar listan och visar grön återkoppling.

