> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Badges, 3.4 Bokningskort, 3.7 Avbokningsmodal, 3.8 Tabbar), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.8 Mina Sidor / Mina Bokningar (`MyBookingsScreen`)

- **Föreslagen route:** `/mina-bokningar` (Föreslagen)
- **Skärm-ID:** `'bookings'`
- **Källfiler:** `src/components/MyBookingsScreen.tsx`, `src/imports/pasted_text/filmvisarna-booking-spec.md`, `src/imports/pasted_text/cinema-app-screens.md`

#### Struktur uppifrån och ned (`max-width: 768px` / `max-w-3xl`, `padding-top: 96px`)
1. **Profilöversiktskort (`#161F30`, `border-radius: 16px`, `padding: 24px`, `margin-bottom: 32px`):**
   - Röd cirkelavatar (`64×64px`, `#E50914`) med initialerna `AL` (`20px`, `Poppins`, `font-weight: 700` — Exempeldata).
   - Rubrik (`h2`): `Mina Sidor` (`20px`, `Poppins`, `font-weight: 700`).
   - E-post: `{savedBookings[0]?.email || 'anna.lindqvist@example.se'}` (Exempeldata).
   - Grön pill-badge: `Gästmedlem` (`12px`, bakgrund `rgba(16, 185, 129, 0.15)`, text `#10B981`).
2. **Segmenterad flikväljare (`#161F30`, `border-radius: 12px`, `padding: 4px`, `margin-bottom: 24px`):**
   - Flik 1: `Aktuella bokningar` (`id: 'active'`)
   - Flik 2: `Bokningshistorik` (`id: 'history'`) *(Spec `filmvisarna-booking-spec.md` nämner även kortformen `"Historik"`)*.
3. **Innehåll under `Aktuella bokningar`:**
   - **Tomt tillstånd (`activeBookings.length === 0`):**
     - Rund ikon-container (`64×64px`, `background: rgba(255, 255, 255, 0.06)`) med filmremsa-ikon (`32×32px`, `#94A3B8`).
     - Rubrik: `Inga aktuella bokningar` (`#F8FAFC`, `font-weight: 500`).
     - Beskrivning: `Dina bokningar visas här när du har bokat biljetter.` (`14px`, `#94A3B8`).
     - Primär knapp: `Se repertoaren` (`#E50914`, navigerar till `'home'`).
   - **Lista med aktiva bokningskort (`space-y-4`):**
     - Grön toppremsa med `Kommande föreställning` till vänster och `{bookingRef}` till höger.
     - Kortkropp med poster (`56×84px`), `{movie.title}`, `{screening.auditorium} · {screening.time}`, sorterade platser (`Rad {rad}, Stol {stol}`), totalpris `{total} kr`, samt knapparna:
       - `Visa biljett` (sekundär knapp, anropar `onViewConfirm(booking)` och går till `'confirm'`).
       - `Avboka` (röd sekundärknapp, öppnar avbokningsmodalen).
4. **Innehåll under `Bokningshistorik`:**
   - Visar alltid tomt tillstånd (`padding: 80px 0`, centrerad text i `#94A3B8`): `Ingen bokningshistorik ännu.`
5. **Avbokningsmodal (`showCancelModal && cancelTarget`):**
   - Backdrop (`rgba(0, 0, 0, 0.7)`), centrerat kort (`max-width: 384px` / `max-w-sm`, `border-radius: 16px`, `padding: 28px`, `#161F30`).
   - Röd varningstriangel-ikon (`24×24px`, `#E50914`) i en cirkel (`48×48px`, `rgba(229, 9, 20, 0.12)`).
   - Rubrik (`h3`): `Är du säker på att du vill avboka?` (`18px`, `Poppins`, `font-weight: 700`).
   - Sammanfattning: `{movie.title} · {screening.time}` (`14px`, `#94A3B8`).
   - Knappar (`gap: 12px`):
     - `Behåll bokning` (sekundär knapp, `rgba(255, 255, 255, 0.08)`, stänger modalen) *(Spec `filmvisarna-booking-spec.md` nämner kortformen `"Behåll"`)*.
     - `Bekräfta avbokning` (primär röd knapp `#E50914`, stänger modalen; i prototypen tas bokningen inte bort ur `savedBookings`-arrayen).

