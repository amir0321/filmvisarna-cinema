# DESIGN.md — Filmvisarna (Figma Make-prototyp)

Detta dokument är den fullständiga design- och gränssnittsspecifikationen för **Filmvisarna**, baserad uteslutande på Figma Make-prototypen i `docs/figma-make/src/`. Alla färger, mått, tillstånd, flöden och UI-texter är extraherade direkt ur prototypens källfiler och kravspecifikationer.

---

## 1. Designspråk och principer

**Källfiler:**
- `docs/figma-make/src/index.css`
- `docs/figma-make/src/imports/pasted_text/filmvisarna-booking-spec.md` (identisk med `docs/figma-make/src/assets/spec2.png`)
- `docs/figma-make/src/imports/pasted_text/cinema-app-screens.md` (identisk med `docs/figma-make/src/assets/upload.png`)

### Visuell identitet
- **Endast mörkt tema (Dark Theme Only):** Applikationen använder en djup grafitmörk sidbakgrund (`#0B0F19`) kombinerad med upphöjda kortytor i marinblå skiffer (`#161F30`) och mörkblå sekundärytor (`#1E2D47`). Ytor avgränsas med diskreta, semitransparenta kantlinjer (`1px solid rgba(148, 163, 184, 0.15)`).
- **Biografkänsla och glasmorfism (Glassmorphism):** Navigationsfält, klibbiga filterrader, bildmärkningar och överlägg använder semitransparenta bakgrunder med oskärpa (`backdrop-filter: blur(4px)` till `blur(20px)`). Hero-sektioner och salongsbilder tonas ut mot sidbakgrunden med mörka linjära gradienter (`linear-gradient`).
- **Tydlig färgkodad semantik:**
  - **Biografröd (`#E50914`):** Primära knappar (CTA), aktiva filterval, fokusringar, 15-årsgräns, Salong 1-identitet och destruktiva åtgärder. Ljusare röd (`#ff6b6b`) används för varningstext vid få platser kvar, sekundära avbokningsknappar och inställda visningar.
  - **Smaragdgrön (`#10B981`):** Valda platser i salongskartan (med grön glöd), genomförda steg, bokningsbekräftelse, "Alla"-åldersgräns, betalda bokningar och Salong 2-identitet på salongssidan.
  - **Bärnstensgul/orange (`#F59E0B` / `#D97706`):** IMDb-stjärnor och betyg, premiärbadges, 7- och 11-årsgräns på filmsidan, väntande betalning ("Inväntar") samt beläggningsvarning (> 80 %).
  - **Blå (`#3B82F6` / `#60A5FA`):** Rullstolsplatser, tillgänglighetsmärkning, Salong 2-badge i admin-schemat samt KPI-indikator för dagens bokningar.
- **Typografisk hierarki:**
  - **Poppins** (`--font-display`) används för rubriker (`h1`–`h3`), logotyp, filmtitlar, belopp och statistiska nyckeltal.
  - **Inter** (`--font-sans`) används för brödtext, knappar, formulärfält, etiketter och tabeller.
  - **JetBrains Mono** (`--font-jetbrains` / `--font-mono`) används för bokningskoder (`FV-XXXXX`), klockslag i admin, radbokstäver i salongskartor och sifferbetyg.
- **Konsekvent geometri och mikrointeraktioner:**
  - Bygger på ett 8px-baserat avståndssystem (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`) och rundade hörn (`16px` för kort, `10px` för knappar/fält, `6px` för stolar, `20px`/`9999px` för chips och badges).
  - Interaktiva element har mjuka övergångar (`0.1s`–`0.35s`): filmkort lyfter vid hover (`translateY(-4px)`) med förstärkt skugga, affischer zoomar in (`scale(1.05)`), och lediga/valda stolar förstoras vid hover (`scale(1.15)`).
- **Tillgänglighet (WCAG AA):**
  - Hög kontrast mellan primär text (`#F8FAFC`) och bakgrund (`#0B0F19`).
  - Synlig fokusindikator (`outline: 2px solid #E50914`, `outline-offset: 2px`) för `input:focus` och `button:focus-visible`.

---


## Filindex för designspecifikationen

| Fil | Innehåll |
| :--- | :--- |
| [design/tokens.md](design/tokens.md) | Sektion 2: Alla designtokens (färger, typografi, avstånd/layoutmått, hörnradier, skuggor/oskärpa samt brytpunkter och z-index) översatta till hex/px/rem och SCSS-variabler. |
| [design/components.md](design/components.md) | Sektion 3: Alla återanvända UI-komponenter (knappar, chips/pills, badges, kort, tabeller, formulär, modaler/BottomSheets, tabbar, inline-feedback, platskartor, steppers och cookie-banner). |
| [design/layout.md](design/layout.md) | Sektion 4: Applikationsskal, publik toppnavigering, admin-toppnavigering, mobil bottennavigering, mobil sidomeny, sidfot samt grid och responsivt beteende. |
| [design/flows.md](design/flows.md) | Sektion 6–10: Användarflöden (bokning, avbokning, admin), roller och behörigheter, ikoner och bilder, funktioner ej med i vår app samt inkonsekvenser och OKLART. |
| [design/coverage.md](design/coverage.md) | Sektion 11: Fullständig täckningslista som mappar samtliga 28 källfiler i `docs/figma-make/src/` mot sektionerna i designspecifikationen. |
| [design/pages/home.md](design/pages/home.md) | Sektion 5.1: Startsida (`HomeScreen`, föreslagen route `/`) med hero-sektion, klibbig filterrad, repertoargrid och interaktioner. |
| [design/pages/filmer.md](design/pages/filmer.md) | Sektion 5.2: Filmer & Repertoar (`FilmerScreen`, föreslagen route `/filmer`) med flikarna På bio nu, Kommande premiärer och trailer-modal. |
| [design/pages/movie-detail.md](design/pages/movie-detail.md) | Sektion 5.3: Filmdetaljer (`MovieDetailScreen`, föreslagen route `/filmer/:id`) med backdrop-hero, faktaruta, medverkande och visningsschema. |
| [design/pages/seat-selection.md](design/pages/seat-selection.md) | Sektion 5.4: Stolsväljaren & Bokning (`SeatSelectionScreen`, föreslagen route `/boka/:visningId`) med biljetträknare, interaktiv platskarta, checkout-panel och platsvalsalgoritm. |
| [design/pages/booking-confirm.md](design/pages/booking-confirm.md) | Sektion 5.5: Bokningsbekräftelse (`BookingConfirmScreen`, föreslagen route `/bekraftelse/:kod`) med bokningskod, biljettsammanfattning, QR-kod och åtgärdsknappar. |
| [design/pages/salonger.md](design/pages/salonger.md) | Sektion 5.6: Våra Salonger (`SalongerScreen`, föreslagen route `/salonger`) med salongskort, minikartor samt tillgänglighets- och dukinformation. |
| [design/pages/om-oss.md](design/pages/om-oss.md) | Sektion 5.7: Om oss (föreslagen route `/om-oss`, saknas som egen skärm i prototypen). |
| [design/pages/mina-bokningar.md](design/pages/mina-bokningar.md) | Sektion 5.8: Mina Sidor / Mina Bokningar (`MyBookingsScreen`, föreslagen route `/mina-bokningar`) med profilöversikt, aktuella bokningar, historik och avbokningsmodal. |
| [design/pages/profil.md](design/pages/profil.md) | Sektion 5.9: Min Profil (`ProfilScreen`, föreslagen route `/profil`) med användarkort samt flikarna Mina uppgifter, Säkerhet och Bokningshistorik. |
| [design/pages/admin-bokningar.md](design/pages/admin-bokningar.md) | Sektion 5.10: Admin – Bokningar & Kassa (`BokningarTab`, föreslagen route `/admin/bokningar`) med snabb incheckning, KPI-kort, bokningslista, live-salongskarta och kassaöversikt. |
| [design/pages/admin-visningar.md](design/pages/admin-visningar.md) | Sektion 5.11: Admin – Visningsschema (`SchemaTab`, föreslagen route `/admin/visningar`) med datumfilter, visningstabell och modal/BottomSheet för ny visning. |
| [design/pages/admin-filmer.md](design/pages/admin-filmer.md) | Sektion 5.12: Admin – Filmarkiv (`FilmarkivTab`, föreslagen route `/admin/filmer`) med sökfunktion, filmtabell och modal/BottomSheet för att lägga till eller redigera film. |
| [design/pages/admin-salonger.md](design/pages/admin-salonger.md) | Sektion 5.13: Admin – Salonger (`SalongerAdminTab`, föreslagen route `/admin/salonger`) med salongskort, förhandsgranskningskarta och konfigurationsmodal. |
| [design/pages/admin-kiosk.md](design/pages/admin-kiosk.md) | Sektion 5.14: Admin – Kiosk (föreslagen route `/admin/kiosk`, saknas i prototypen). |
| [design/DESIGN.original.md](design/DESIGN.original.md) | Oförändrad originalkopia av hela `DESIGN.md` före uppdelningen. |

---

## 5. Sidor

### Översikt över skärmar och föreslagna routes

| Föreslagen route | Status i prototypen | Skärm-ID (`Screen`) | Källfil i `docs/figma-make/src/` |
| :--- | :--- | :--- | :--- |
| `/` (Föreslagen) | Finns | `'home'` | `src/components/HomeScreen.tsx` |
| `/filmer` (Föreslagen) | Finns | `'filmer'` | `src/components/FilmerScreen.tsx` |
| `/filmer/:id` (Föreslagen) | Finns | `'detail'` | `src/components/MovieDetailScreen.tsx` |
| `/boka/:visningId` (Föreslagen) | Finns | `'seats'` | `src/components/SeatSelectionScreen.tsx` |
| `/bekraftelse/:kod` (Föreslagen) | Finns | `'confirm'` | `src/components/BookingConfirmScreen.tsx` |
| `/salonger` (Föreslagen) | Finns | `'salonger'` | `src/components/SalongerScreen.tsx` |
| `/om-oss` (Föreslagen) | **Saknas i prototypen** | — | — |
| `/mina-bokningar` (Föreslagen) | Finns | `'bookings'` | `src/components/MyBookingsScreen.tsx` |
| `/profil` (Föreslagen) | Finns | `'profil'` | `src/components/ProfilScreen.tsx` |
| `/admin/bokningar` (Föreslagen) | Finns (som flik i `AdminScreen`) | `'admin'` (`activeTab: 'bokningar'`) | `src/components/AdminScreen.tsx`, `src/components/admin/BokningarTab.tsx` |
| `/admin/visningar` (Föreslagen) | Finns (som flik i `AdminScreen`) | `'admin'` (`activeTab: 'schema'`) | `src/components/AdminScreen.tsx`, `src/components/admin/SchemaTab.tsx` |
| `/admin/filmer` (Föreslagen) | Finns (som flik i `AdminScreen`) | `'admin'` (`activeTab: 'filmarkiv'`) | `src/components/AdminScreen.tsx`, `src/components/admin/FilmarkivTab.tsx` |
| `/admin/salonger` (Föreslagen) | Finns (som flik i `AdminScreen`) | `'admin'` (`activeTab: 'salonger'`) | `src/components/AdminScreen.tsx`, `src/components/admin/SalongerAdminTab.tsx` |
| `/admin/kiosk` (Föreslagen) | **Saknas i prototypen** | — | — |

