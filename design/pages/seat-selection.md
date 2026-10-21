> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.6 Formulär, 3.10 Platskarta, 3.11 Antal-väljare & StepIndicator), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.4 Stolsväljaren & Bokning (`SeatSelectionScreen`)

- **Föreslagen route:** `/boka/:visningId` (Föreslagen)
- **Skärm-ID:** `'seats'`
- **Källfiler:** `src/components/SeatSelectionScreen.tsx`, `src/data.ts`, `src/index.css`, `src/imports/pasted_text/filmvisarna-booking-spec.md`, `src/imports/pasted_text/cinema-app-screens.md`

#### Struktur uppifrån och ned (`max-width: 1152px`, `padding-top: 96px`)
1. **Topprad:**
   - Vänster: Tillbaka-knapp med vänsterchevron och filmens titel `{movie.title}` (`14px`, `#94A3B8`, går tillbaka till `'detail'`).
   - Höger: `StepIndicator` med stegen `1. Biljetter`, `2. Välj platser`, `3. Bekräftelse`.
2. **Film-mini-info (`#161F30`, `border-radius: 12px`, `padding: 16px`, `margin-bottom: 32px`):**
   - Liten poster (`48×72px`, `border-radius: 8px`), filmtitel (`16px`, `Poppins`) och undertill `{auditorium} · {time}–{endTime} · {format}` (`14px`, `#94A3B8`).
3. **Huvudgrid (1 kolumn på `< 1024px`, 3 kolumner `lg:grid-cols-3` på `>= 1024px`, `gap: 32px`):**
   - **Vänster/Mitten (`lg:col-span-2`, `space-y-6`):**
     - **Kort 1 – Biljettval (`#161F30`, `border-radius: 16px`, `padding: 24px`):**
       - Rubrik (`h2`): `1. Välj biljetter` (`18px`, `Poppins`).
       - Underrubrik: `Välj antal biljetter per kategori` (`12px`, `#94A3B8`).
       - Tre `TicketCounter`-rader (priser från `TICKET_PRICES` — Exempeldata):
         - `Vuxen` — `140 kr`
         - `Pensionär` — `120 kr`
         - `Barn (under 12 år)` — `80 kr`
       - **Grön totalsummeringsruta (visas när `totalTickets > 0`):** Bakgrund `rgba(16, 185, 129, 0.1)`, kantlinje `1px solid rgba(16, 185, 129, 0.2)`, bockikon till höger och text i `#10B981`:
         - `Totalt: {totalPrice} kr för {totalTickets} biljett` (om 1) respektive `Totalt: {totalPrice} kr för {totalTickets} biljetter` (om > 1).
     - **Kort 2 – Platskarta (visas endast när `totalTickets > 0`, `#161F30`, `border-radius: 16px`, `padding: 24px`):**
       - Rubrik (`h2`): `2. Välj platser` (`18px`, `Poppins`).
       - Underrubrik: `Bästa tillgängliga platser är förvalda — klicka för att ändra` (`12px`, `#94A3B8`).
       - Bioduk (`BIODUK`), stolsmatris (`A`–`J`, `1`–`12`) och legend (`Ledig`, `Vald`, `Upptagen`) enligt sektion 3.10.
   - **Höger – Checkout-panel (`lg:col-span-1`, `position: sticky`, `top: 96px`, `#161F30`, `border-radius: 16px`, `padding: 24px`):**
     - Rubrik (`h2`): `Din bokning` (`16px`, `Poppins`).
     - **Valda platser-ruta (visas när `selectedSeats.length > 0`):** Visar `{screening.auditorium}` (`12px`, `#94A3B8`) och sorterad lista `Rad {rad}, Stol {stol}` separerade med ` · ` (`14px`, `#F8FAFC`).
     - **Prisuppdelning (visas när `totalTickets > 0`):**
       - `{adultCount}× Vuxen` / `{adultCount * 140} kr` (om `adultCount > 0`)
       - `{seniorCount}× Pensionär` / `{seniorCount * 120} kr` (om `seniorCount > 0`)
       - `{childCount}× Barn` / `{childCount * 80} kr` (om `childCount > 0`)
       - Avdelare + rad: `Totalt` / `{totalPrice} kr` (`font-weight: 600`).
     - **Gul kassapolicy-notis:**
       - `Ingen onlinebetalning krävs. Biljetterna betalas och hämtas ut i kassan senast 15 minuter innan föreställningen börjar.`
     - **E-postfält (visas när `totalTickets > 0 && selectedSeats.length === totalTickets`):**
       - Etikett: `E-post för bokningsbekräftelse`
       - Input (`type="email"`): placeholder `din@epost.se`.
     - **Primär CTA-knapp (dynamisk etikett och disabled-status):**
       - Om `totalTickets === 0`: `Välj biljetter` (`disabled`, `opacity: 0.4`)
       - Om `selectedSeats.length < totalTickets`: `Välj {totalTickets - selectedSeats.length} platser till` (`disabled`, `opacity: 0.4`)
       - Om `selectedSeats.length === totalTickets` (`> 0`): `Slutför bokning` (aktiv; klick sparar e-post, genererar bokningskod `FV-XXXXX` och navigerar till `'confirm'`).

#### Algoritm för automatiskt platsval
- När `totalTickets` ändras väljer prototypen automatiskt sammanhängande lediga platser genom att söka i radordningen `['E', 'F', 'D', 'G', 'C', 'H', 'B', 'I', 'A', 'J']` från stol `1` till `12`. Om inga sammanhängande platser ryms på en rad plockas enskilda lediga stolar i samma radordning.
- Vid klick på en ledig stol: om stolen redan är vald avmarkeras den; om färre än `totalTickets` är valda läggs den till; om `selectedSeats.length === totalTickets` ersätts den senast valda stolen (`[...selected.slice(0, -1), seatId]`).

