> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Badges, 3.4 Kort, 3.9 Inline-feedback), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.5 Bokningsbekräftelse (`BookingConfirmScreen`)

- **Föreslagen route:** `/bekraftelse/:kod` (Föreslagen)
- **Skärm-ID:** `'confirm'`
- **Källfiler:** `src/components/BookingConfirmScreen.tsx`, `src/data.ts`, `src/imports/pasted_text/filmvisarna-booking-spec.md`, `src/imports/pasted_text/cinema-app-screens.md`

#### Struktur uppifrån och ned
Centrerat kort (`max-width: 512px` / `max-w-lg`, `border-radius: 24px`, bakgrund `#161F30`, `border: 1px solid rgba(255, 255, 255, 0.08)`):
1. **Grön toppsektion (`padding: 40px 32px 32px`, `background: linear-gradient(to bottom, rgba(16, 185, 129, 0.12), transparent)`):**
   - Cirkel (`64×64px`, `background: rgba(16, 185, 129, 0.15)`, `border: 2px solid rgba(16, 185, 129, 0.4)`) med grön bockikon (`36×36px`, `#10B981`).
   - **Huvudrubrik (`h1`):** `Tack för din bokning!` (`30px`, `Poppins`, `font-weight: 700`) *(Spec `cinema-app-screens.md` nämner även `"Bokning bekräftad!"`)*.
   - **Underrubrik:** `En bekräftelse skickas till {email || 'din e-post'}` (`14px`, e-postadressen i `#F8FAFC`).
2. **Bokningskod-sektion (`padding: 0 32px 24px`):**
   - Etikett: `Bokningskod` (`12px`, `uppercase`, `letter-spacing: 0.1em`, `#94A3B8`, centrerad).
   - Kodruta (`padding: 16px 20px`, `border-radius: 16px`, `background: rgba(255, 255, 255, 0.05)`, `border: 1px solid rgba(255, 255, 255, 0.1)`):
     - Vänster: `{bookingRef}` (t.ex. `FV-8K49P` — Exempeldata; genereras slumpmässigt med prefix `FV-` följt av 5 tecken ur `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, `30px`, `JetBrains Mono`, `font-weight: 700`, `letter-spacing: 0.2em`).
     - Höger: Knapp `Kopiera` med kopiera-ikon (växlar till grön `Kopierat` med bockikon i 2 sekunder vid klick via `navigator.clipboard.writeText`).
3. **Biljettavdelare (Perforerad linje):**
   - Två halvcirklar i sidbakgrundsfärg (`24×24px`, `#0B0F19`, `margin: -28px`) på sidorna om en streckad horisontell linje (`border-top: 1px dashed rgba(255, 255, 255, 0.1)`).
4. **Sammanfattning och QR-kod (`padding: 24px 32px 32px`):**
   - **Filminfo:** Poster (`56×84px`, `border-radius: 8px`), filmtitel (`16px`, `Poppins`), `{auditorium}` (`14px`, `#94A3B8`) och `{time}–{endTime}` (`14px`, `#F8FAFC`).
   - **Platser grupperade per rad:** `Rad {row}: Stol {seats.join(', ')}` (t.ex. `Rad E: Stol 1, 2, 3`).
   - **Prisruta (`padding: 16px`, `border-radius: 12px`, `background: rgba(255, 255, 255, 0.04)`):**
     - Biljettrader (`{count}× Vuxen`, `{count}× Pensionär`, `{count}× Barn`) med delsummor i `kr`.
     - Summeringsrad under kantlinje: `Att betala i kassan` till vänster (`#94A3B8`) och `{totalPrice} kr` till höger i grönt (`#10B981`, `font-weight: 600`).
   - **QR-kodruta (`padding: 20px`, `border-radius: 16px`, `background: rgba(255, 255, 255, 0.03)`):**
     - Text överst: `Visa upp vid kassan` (`12px`, `#94A3B8`).
     - Vit ruta (`112×112px`, `border-radius: 12px`, `padding: 8px`) med en `21×21` SVG-QR-kod.
     - Bokningskoden `{bookingRef}` i `JetBrains Mono` (`12px`, `#94A3B8`) under QR-koden.
   - **Åtgärdsknappar (`space-y-3`):**
     1. `Skriv ut / Spara som PDF` (sekundär knapp, anropar `window.print()`).
     2. `Avboka biljett` (röd outline-knapp, navigerar till `'bookings'`).
     3. `Tillbaka till startsidan` (tertiär textknapp, navigerar till `'home'`).

