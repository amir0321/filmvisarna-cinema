> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Statusbadges, 3.4 Bokningskort & KPI-kort, 3.5 Tabeller, 3.6 Formulär, 3.8 Admin-flikar, 3.10 MiniSeatMap), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.10 Admin – Bokningar & Kassa (`AdminBookings.tsx`)

- **Route:** `/admin/bokningar`.
- **Nuvarande implementation:** [Frontend/src/pages/admin/AdminBookings.tsx](../../Frontend/src/pages/admin/AdminBookings.tsx) är en platshållare. Bokningslista, kassaflöde och platsval ska byggas enligt kraven nedan.
- **Befintligt backendstöd:** [bokningsservice](../../Backend/src/services/bookings.service.ts), [bokningsrutter](../../Backend/src/routes/bookings.ts), [platsfrisläppning](../../Backend/src/services/reservationExpiry.service.ts) och [statistik](../../Backend/src/services/admin.service.ts). API-detaljer finns i [Backend/README.md](../../Backend/README.md).
- **Prototyp:** `AdminScreen.tsx`, `BokningarTab.tsx` och `adminData.ts` i Figma-underlaget beskriver layout och exempeldata. Verksamhetsregler och API-kontrakt nedan har företräde.

#### Bindande krav för tema (mörkt/ljust) och översättning (`sv` / `en`)

När `/admin/bokningar` (`AdminBookings.tsx`) och administrationsöversikten (`/admin`, `AdminDashboard.tsx`) byggs ut från nuvarande platshållare gäller följande krav:
- **Mörkt och ljust tema (`dark` / `light`, FE-36):**
  - Fasta hex-värden i prototypbeskrivningen nedan (`#161F30`, `#0B0F19`, `#F8FAFC`, `#94A3B8`, `#10B981`, `#F59E0B`, `#E50914`, `#3B82F6`) avser endast prototypens mörka tema.
  - I implementationen **måste** semantiska tokens från [design/tokens.md](../tokens.md) användas: `$fv-card-bg` (`--color-surface`) för kort/tabell/sidopanel, `$fv-muted-bg` (`--color-surface-muted`) för sökfält/select, `$fv-fg` (`--text-primary`) för primär text, `$fv-muted-fg` (`--text-muted`) för dämpad text, `$fv-border` (`--border-default`) för kantlinjer samt `$fv-primary`, `$fv-success`, `$fv-warning`, `$fv-info` och `tint(...)` / `$white-overlay-*` för statusbadges, KPI-kort och knappar.
  - Alla text-/ytkombinationer, statusbadges (`Betald` / `Inväntar`), sökfält, tabellrader, mobilkort och `MiniSeatMap` ska uppfylla WCAG AA (`>= 4,5:1`) i både mörkt och ljust tema.
- **Svensk och engelsk översättning (`sv` / `en`):**
  - Inga hårdkodade strängar i komponenterna. Alla rubriker, brödsmulor (`AdminPageHeader`), KPI-etiketter, filterval, tabellhuvuden, mobilkortsetiketter, knappar, inline-bekräftelser, laddnings-/tom-/feltillstånd och `aria-label`-attribut ska hämtas via det gemensamma översättningssystemet:
    - Sidhuvud: `Bokningar & Kassa` / `Bookings & Box Office`, underrubrik `Hantera dagens bokningar och kassa` / `Manage today's bookings and box office`, brödsmula `Backoffice › Bokningar & Kassa` / `Backoffice › Bookings & Box Office`.
    - Snabb incheckning: `Snabb incheckning` / `Quick check-in`, placeholder `Sök bokningsnummer (t.ex. FV-8K49P) eller kundens e-post…` / `Search booking reference (e.g. FV-8K49P) or customer email…`, knapp `Checka in` / `Check in`.
    - KPI-kort: `Dagens bokningar` / `Today's bookings` (`{pending} inväntar · {paid} betalda` / `{pending} pending · {paid} paid`), `Förväntad intäkt` / `Expected revenue` (`{totalRevenue} kr betalt` / `{totalRevenue} kr paid`), `Beläggning` / `Occupancy` (`{soldSeats}/{totalSeats} platser` / `{soldSeats}/{totalSeats} seats`).
    - Visningsfilter & tabell: `Filtrerar visning:` / `Filter screening:`, kolumner `Bokningsnr` / `Booking ref`, `Kund` / `Customer`, `Film & Tid` / `Movie & Time`, `Salong` / `Auditorium`, `Platser / Biljetter` / `Seats / Tickets`, `Belopp` / `Amount`, `Åtgärd` / `Action`.
    - Status & åtgärder: `Betald` / `Paid`, `Inväntar` / `Pending`, `Markera betald` / `Mark as paid`, `✓ Betald` / `✓ Paid`, `Avboka` / `Cancel`, inline-bekräftelse `Bekräfta` / `Confirm` och `Avbryt` / `Cancel`, poängfeedback `+{points} poäng` / `+{points} points`, tomt tillstånd `Inga bokningar hittades.` / `No bookings found.`.
    - Sidopanel: `Salongskarta — live` / `Auditorium map — live`, legend `Ledig` / `Available`, `Bokad` / `Booked`, `Inväntar` / `Pending`, samt `Kassaöversikt` / `Box office summary` (`Kvar att betala` / `Awaiting payment`, `Redan betalat` / `Already paid`, `Totalt idag` / `Total today`).

#### Bindande säkerhetskrav för framtida adminarbete

- Följ [bokningssäkerhet](../booking-security.md#åtskillnad-och-framtida-adminarbete--krav-inte-implementerad-adminfunktion). Kraven dokumenteras nu; ingen ny adminfunktion byggs i den aktuella ändringen.
- Håll väntande och utgångna gästförfrågningar separata från bekräftade bokningar, biljettantal, beläggning och kassastatistik. En framtida förfrågningsvy ska vara separat, behörighetskontrollerad och aldrig visa verifieringstoken, tokenhash eller mejllänkar.
- Flagga ovanligt många bokningar, stora mängder obetalda platser, upprepade kvotöverträdelser och misstänkt boknings-/avbokningsbeteende. Visa förklaringen till flaggan; VPN eller delad IP är inte ensamt skäl för avbokning.
- Behörig personal ska kunna granska och avboka misstänkta bokningar med uttrycklig bekräftelse och motivering. Platser och status uppdateras i samma transaktion. Hantering av betalda bokningar och återbetalning måste specificeras före implementation.
- Alla sådana API-anrop kräver `requireAdmin` på servern. Åtgärder loggas med administratör, tid, bokningsreferens, åtgärd och motivering i en skyddad granskningslogg.

#### Bindande verksamhetsregler: reservation, betalning och incheckning

Dessa regler gäller både medlems- och gästbokningar. E-postbekräftad gästbokning betyder att platserna har reserverats, inte att biljetterna har betalats.

| API-status | Visas för personalen | Platser och tillåtna åtgärder |
| --- | --- | --- |
| `reserved`, `isPaid: false` | Reserverad – obetald / Reserved – unpaid | Platserna hålls fram till 15 minuter före filmstart. Visa betalningsfrist och `Markera betald`. Incheckning kräver betalning. |
| `confirmed`, `isPaid: true` | Betald / Paid | Platserna behålls även vid sen ankomst. `Checka in` är en separat åtgärd. Visa dessutom `Incheckad` / `Checked in` när `isCheckedIn` är sann. |
| `expired`, `isPaid: false` | Reservationen har släppts / Reservation released | Ursprungliga stolar är inte garanterade och får säljas till andra. Före filmens slut kan personalen försöka registrera ett sent köp med ny ledighetskontroll och vid behov nya platser. |
| `cancelled` | Avbokad / Cancelled | Ingen betalning eller incheckning. Historik behålls; bokningen får inte återaktiveras via betalningsknappen. |

- **Exakt reservationsfrist:** Vid start kl. 18:00 gäller reservationen fram till kl. 17:45. Från och med kl. 17:45 släpps obetalda platser. Nya obetalda nätreservationer stoppas samtidigt; sena kunder hänvisas till kassan. Betalda platser släpps inte på grund av sen ankomst.
- **Kundens avbokning:** Betalda bokningar kan avbokas senast två timmar före start. Obetalda reservationer får avbokas fram tills platserna släpps 15 minuter före start; vid själva fristen är reservationen redan släppt. Detta gäller både medlemsavbokning och gästernas referens-/e-postflöde. En uttryckligt avbokad bokning ska hållas åtskild från uteblivet besök.
- **Tidskälla:** Backend avgör status, ledighet och tidsgränser. Frontend får visa en lokal nedräkning och uppdatera noteringen vid fristen, men får aldrig bekräfta ett köp utifrån enbart lokal tid eller cachad platskarta. Datum och tider visas i `Europe/Stockholm` med valt språk.
- **Historik är inte beläggning:** Släppta biljetter finns kvar som inaktiva (`ticket.is_active = false`) så att ursprungliga platser, biljettkategorier och belopp kan visas. De ska aldrig ritas som upptagna stolar eller räknas som aktuella reservationer. Platskartan och API:ts beräknade status gäller även om minutjobbet inte har hunnit köras.
- **Sjudagarsrensning:** Obetalda, utgångna bokningar och deras biljetter/kioskbeställningar raderas automatiskt sju dagar efter filmens sluttid. Betalda och avbokade bokningar behålls. Det ska inte finnas en separat manuell rensningsknapp i kassavyn. Om en historikrad har rensats ska `404` hanteras med synligt meddelande och omladdad lista.

#### Bindande kassaflöde att bygga

1. **Sök och granska:** Sök på bokningsreferens eller e-post. Visa film, datum/tid, salong, kund, medlems-/gästbokning, platser, biljettkategorier, kioskvaror, totalbelopp, betalstatus och incheckningsstatus. För obetalda reservationer visas sista betalningstid; för släppta reservationer visas att stolarna inte längre är garanterade.
2. **Registrera betalning:** Personalen tar emot betalningen på plats och väljer `Markera betald`. Detta registrerar kassabetalningen; endpointen drar inte pengar via kort eller Swish. Inaktivera åtgärden medan anropet pågår. Visa `Betald` och uppdatera data först efter lyckat API-svar.
3. **Sen kund med släppt reservation:** Visa `Kontrollera lediga platser` / `Check seat availability` och hämta en aktuell platskarta för rätt visning. Förklara att de tidigare stolarna kan ha sålts. Ett sent köp måste genomföras före filmens sluttid och godkännas av servern.
   - Utan `seatIds` försöker betalnings-API:t återta de ursprungliga platserna. Det lyckas endast om alla fortfarande är lediga.
   - Om någon stol är upptagen ska personalen kunna välja lika många andra lediga stolar i samma salong och skicka `seatIds` vid betalningen. Biljettkategorier och kioskbeställning behålls. Backend kopplar listan till de befintliga biljetterna i stigande `seat_id`-ordning; UI måste bevara kategorikopplingen när platser byts.
   - Vid `409` ska frontend visa konflikten, läsa om platskartan och låta personalen göra ett nytt uttryckligt val. Ingen bokning får markeras betald, inga poäng visas som tilldelade och ingen annan kunds stol får flyttas. En visad ledig stol är inte garanterad förrän servern godkänt köpet.
4. **Checka in separat:** `Checka in` kräver betald bokning. Visa en hänvisning till betalningsflödet för obetalda/släppta reservationer. Ett vanligt klick på `Markera betald` ska inte samtidigt checka in kunden. En eventuell uttrycklig `Betala och checka in`-åtgärd får använda den generella PATCH-rutten med båda fälten i samma transaktion.
5. **Återkoppling och synkronisering:** Efter lyckad betalning, platsbyte eller incheckning laddas bokning, lista, berörda KPI:er och platskarta om från servern. Återanvänd den gemensamma bokningsnotifieringen för Mina sidor i samma webbläsare/flikar. Mina sidor kontrollerar också betalstatus var 30:e sekund när sidan är synlig. Uppdatera kassavyn vid återkomst till fliken och regelbundet medan den är synlig, med städning av intervall och avbrutna anrop vid avmontering.

#### Befintliga API-anrop att koppla in

Använd den gemensamma API-klienten för sessionscookie och CSRF-header. Boknings- och betalningsrutterna nedan kräver `requireAdmin`; visningslistan och platskartan är publika läs-API:er.

| Behov | Anrop | Kontrakt |
| --- | --- | --- |
| Bokningslista och sökning | `GET /api/bookings` | Filter: `screeningId`, `status` (`reserved`, `confirmed`, `expired`, `cancelled`), `isPaid`, `search`, `from`, `to`. E-postsökning går via `search`. |
| Exakt bokningsreferens | `GET /api/bookings/lookup?reference=FV-ABCDE` | En bokning med serverberäknad status och aktuella uppgifter. |
| Kassabetalning | `PATCH /api/bookings/:id/pay` | Ingen kropp krävs för ursprungliga platser. Alternativa platser: `{ "seatIds": [41, 42] }`. |
| Separat incheckning | `PATCH /api/bookings/:id/checkin` | Kräver betald bokning. Returnerar uppdaterad bokning. |
| Kombinerad registrering | `PATCH /api/bookings/:id` | Exempel: `{ "isPaid": true, "isCheckedIn": true, "seatIds": [41, 42] }`. `seatIds` får bara skickas med betalning och måste innehålla lika många olika giltiga stolar som befintliga biljetter. |
| Visningar och platskarta | `GET /api/screenings`, `GET /api/screenings/:id/seats` | Visningslistan innehåller kommande visningar. Spara den uppslagna bokningens visning för sena kunder när den inte längre finns i listan. Platskartan kan hämtas för visnings-ID:t även efter start. |
| Dagens KPI:er | `GET /api/admin/stats` | Använd backendens totalsummor; ersätt prototypens hårdkodade beräkningar. |

- **Datamappning:** Råa bokningssvar använder `reference`, ett nästlat `screening` och `tickets[].number`/`priceGroup`. Frontendens `Booking` använder `bookingRef`, `screeningStartsAt`, `screeningEndsAt` och `tickets[].seatNumber`/`type`. Följ mappningen i [Frontend/src/api/bookings.ts](../../Frontend/src/api/bookings.ts); typa inte ett rått API-svar direkt som frontendmodellen.
- **Betalningssvar:** `{ success, message, booking, pointsAwarded }`. Vanlig/gemensam PATCH returnerar samma fält. Incheckningssvaret saknar `pointsAwarded`. Använd svarets bokning som bekräftelse och läs sedan om berörda vyer.
- **Lojalitetspoäng:** Backend ger `Math.round(totalPrice)` poäng till medlemsbokningar vid första betalningen. Gästbokningar ger 0 poäng. Upprepad betalning ger `pointsAwarded: 0`; frontend får aldrig själv räkna upp medlemspoäng. Visa `+{points} poäng` / `+{points} points` endast från ett lyckat svar.
- **Återförsök:** Blockera dubbelklick. Vid osäkert nätverksutfall, läs om bokningen innan nästa försök. Samma redan genomförda betalning, inklusive samma `seatIds`, är idempotent; byte av stolar på en redan betald bokning stöds inte av denna åtgärd.
- **Fel:** `400` för bland annat avbokad bokning eller ogiltigt platsval, `401` för saknad session, `403` för saknad adminbehörighet, `404` för saknad/rensad bokning och `409` för platskonflikt, film som har slutat eller otillåten incheckning. Visa lokaliserad text och behåll personalens sökning/filter.
- **Betalningsåterställning:** Generell PATCH stöder `isPaid: false` och drar tillbaka tidigare medlemspoäng. Om kunden är incheckad krävs även `isCheckedIn: false`. Detta är en registerändring, inte en faktisk återbetalning. Bygg ingen återbetalningsknapp förrän kassahantering och behörigheter har specificerats.

#### Återstående backendkrav – får inte simuleras i frontend

- **Nytt köp för en kund utan befintlig bokning:** Någon separat adminendpoint för nya kassaköp finns ännu inte. Den publika `POST /api/bookings` skapar en obetald reservation för en verifierad medlem och stoppar nya reservationer sista 15 minuterna; den får inte användas som genväg för walk-in-köp. När nytt kassaköp byggs behövs ett adminskyddat API med atomär platskontroll, priser från servern, betalregistrering och poäng enligt samma regler. Befintliga sena köp med boknings-ID stöds redan enligt ovan.
- **Adminavbokning av andras bokningar:** Nuvarande `DELETE /api/bookings/:id` är kundens ägarstyrda avbokning med betalningsberoende tidsgräns, inte en generell adminavbokning. De publika referens-/e-postrutterna får inte användas som genväg. Separat admin-API med motivering, granskningslogg och regler för betalda bokningar krävs enligt säkerhetskraven ovan. Tills dess ska gränssnittet tydligt ange begränsningen och aldrig enbart ta bort en rad lokalt.
- **Granskningslogg och missbrukshantering:** Kraven ovan är framtida arbete. Befintliga betalnings-/incheckningsrutter betyder inte att generell adminavbokning, återbetalning eller administrativ granskningslogg redan är implementerad.

#### Uteblivna besök, varningar och reservationsspärr – automatik och framtida adminhantering

**Beslut:** Tre giltiga varningar inom en rullande period på 90 dagar ger 30 dagars spärr för nya obetalda reservationer. Automatisk varningsräkning, beständig spärrlagring, mejlkö, reservationskontroller och kundinformation är implementerade. Personalens vy och API för granskning, rättelser och hävning ska byggas senare enligt kraven nedan. Bygg vidare på den befintliga automatiken; ersätt den inte med lokal frontendlogik.

- **När en varning skapas:** Först när filmens sluttid har passerat och en tidigare skapad bokning fortfarande är obetald och inte uttryckligen avbokad. Att stolarna släpps 15 minuter före start ger inte en varning i sig. En kund som kommer sent och betalar före filmens slut får ingen varning. Gästförfrågningar som aldrig bekräftats via e-post ger aldrig varningar.
- **En bokning, en varning:** En bokning ger högst en varning oavsett antal stolar/kioskvaror, omstarter eller upprepade städkörningar. Använd serverberäknad sluttid och en beständig unik koppling till bokningen. Kontroll och registrering ska vara atomära så att samtidig kassabetalning inte kan skapa en felaktig varning.
- **Konto och e-post:** Samma verifierade identitet ska dela varningar mellan gäst- och medlemsbokningar. Normalisera e-post med trimning och gemener enligt befintlig bokningskod. Koppla medlemsbokningars varningar till kontot också; växling mellan inloggad bokning och gästbokning med samma adress får inte kringgå spärren. En obekräftad e-postförfrågan får inte användas för att ge någon annan varningar.
- **Tröskel och sluttid:** När den tredje giltiga varningen registreras inom de senaste 90 dagarna sätts en beständig spärr med start- och sluttid, 30 dagar från aktivering. Äldre och rättade varningar ska inte räknas. Samma tre händelser får inte återutlösa eller förlänga spärren när jobbet körs igen. Efter spärrtiden ska kunden kunna reservera igen; nya beslut måste bygga på nya uteblivanden, inte enbart återanvända den gamla tröskeln.
- **Spärrens omfattning:** Stoppa endast nya obetalda reservationer. Kontoåtkomst, historik, avbokning och betalning av befintliga bokningar ska fungera. Betalda kassaköp ska fortfarande tillåtas om platser finns. Backend måste kontrollera spärren i både medlemsbokning och gästernas förfrågnings-/bekräftelseflöde, även om kunden har en gammal gästlänk. Personalens kassaköp får inte av misstag använda den blockerade publika reservationsvägen.
- **Sjudagarsrensning:** Spara varnings-/spärrhistorik separat från bokningens livstid. När en obetald bokning raderas sju dagar efter filmens sluttid får dess varning och en aktiv spärr inte försvinna genom kaskadradering. Registrera uteblivandet innan bokningen rensas. Behåll tillräcklig referens, tid och orsak för att personalen ska kunna bedöma och rätta händelsen även efter rensningen; spara inte överflödiga bokningsuppgifter eller token.
- **Kundinformation – implementerad:** `GET /api/bookings/reservation-status` ger den inloggade kundens `warningCount`, `warningLimit`, `windowDays`, `blockDays`, `blockedUntil` och `warnings` (ID, bokningsreferens, filmens sluttid, registreringstid och `usedForBlock`). Kundens identitet tas alltid från sessionen. Verifierad gästförhandsvisning innehåller samma struktur i `reservationStatus`; offentliga förfrågningar får endast en generell nekad-reservationsåtgärd vid spärr, ingen varningshistorik eller exakt sluttid. Mina sidor och bokningsflödet visar nya varningar av tre, historik och spärrens sluttid. Varningar som redan använts för en spärr visas i historiken men återanvänds inte i en ny tröskel. Meddela kunden om en ny varning och om spärren; notifieringskanal och leverans ska byggas med säkra återförsök utan dubbla utskick. Visa information på Mina sidor för medlemmar och i det verifierade gästflödet för gäster. Alla texter ska finnas på svenska och engelska. Röj inte någon annans varningshistorik i ett offentligt uppslags-API.
- **Placering och omfattning:** Varningshanteringen ska vara en liten sektion i kundens detaljvy eller detaljmodal i Admin/Bokningar. Ingen separat varningssida, route eller navigationsflik ska byggas. Sektionen ska låta personal se varningar och orsaker, rätta felaktiga varningar och häva felaktiga spärrar med motivering. Registrering, spärrar och upplåsning efter 30 dagar sköts av den befintliga automatiken.
- **Kundsektion och rättelse-API att bygga senare:** Befintliga tabeller har `revoked_at` och `revocation_reason`, men inget admin-API eller administrativt rättelseflöde finns ännu. Rättelse-API:t måste låsa samma verifierade identitet som reservationskontrollerna och hålla rättelse, omräkning och eventuell spärrhävning i en transaktion. Visa varningar med bokningsreferens, visningens sluttid, orsak, registreringstid, om varningen räknas inom 90 dagar samt eventuell rättelse. Visa också spärrens start/slut och aktuell status. Personal ska kunna rätta en felaktig varning och häva en felaktig spärr med obligatorisk motivering. Räkna om underlaget och häv en spärr som beror på en rättad felaktig varning. Skydda alla åtgärder med `requireAdmin` och beständig granskningslogg med administratör och tid; ingen tyst radering av varningshistorik.
- **Införande – implementerat:** `20261116_booking_warnings.sql` skapar `booking_warning_policy` med ett beständigt `activated_at`. Både bokningens skapandetid och filmens sluttid måste ligga efter aktivering för att ge en varning. Gamla demo-/historikbokningar ger därmed ingen retroaktiv massvarning. `booking_warning` lagrar händelser och mejlkö, `booking_reservation_block` lagrar spärrperioder. Minutjobbet registrerar varningar före sjudagarsrensning; kontroller görs även före nya reservationer. Migreringen är omkörbar och återställer inte aktiveringsdatumet.

Acceptans för automatiken och kommande adminintegration: ett obetalt uteblivet besök ger exakt en varning efter filmens slut; avbokning eller sen betalning ger ingen; tre varningar inom 90 dagar ger exakt en 30-dagarsspärr; gäst-/medlemsväxling och bokningsrensning kringgår inte spärren; betalda kassaköp fungerar; efter 30 dagar upphör spärren; en felaktig varning kan rättas med spårbar motivering. Återanvänd befintliga boknings-/tidsgränstester och lägg till fokuserade kontroller för dessa kärnfall när adminhanteringen implementeras.

#### Acceptanskriterier för kommande implementation

1. En obetald reservation till kl. 18:00 visar betalningsfristen 17:45. Vid 17:45 visas den som släppt och stolarna som lediga, även om städjobbet inte körts. En betald bokning behåller stolarna.
2. En sen kund kan betala före filmens sluttid om ursprungliga eller uttryckligen valda alternativa platser är lediga. Om två kassor försöker köpa samma stol lyckas högst ett anrop; det andra ger konflikt utan betalning eller poäng.
3. Betalning och incheckning visas separat. Obetald/avbokad bokning kan inte checkas in. Samma betalningsanrop kan upprepas utan dubbla poäng; gäster får inga medlemspoäng.
4. Släppta/avbokade bokningar och gästförfrågningar räknas inte som aktuell beläggning eller pengar att ta emot. KPI:er hämtas från servern och blandas inte med lokalt filtrerade exempeldata.
5. Obetalda utgångna bokningar försvinner först vid automatisk rensning sju dagar efter filmens sluttid. Betalda och avbokade bokningar finns kvar i historiken. En rensad bokning ger ett begripligt tom-/feltillstånd.
6. Flödet fungerar på mobil och desktop, i mörkt/ljust tema och på svenska/engelska, inklusive tangentbordsåtkomst, fokus, statusmeddelanden och API-fel. Verifiera kärnflödena och återanvänd befintliga backendtester för tidsgränser och dubbelbokning.

#### Layout från prototypen – bygg med riktiga data enligt kraven ovan

Prototypens belopp, visningar och antal är exempel. KPI:er från `GET /api/admin/stats` gäller hela dagen; de ska inte räknas om från den lokalt filtrerade bokningslistan. Använd `bookingsToday`, `bookingsWaiting`, `bookingsPaid`, `expectedRevenue`, `paidRevenue`, `occupancyRatePercent`, `bookedSeatsToday` och `totalSeatsToday`. Kvar att betala är `expectedRevenue - paidRevenue` och omfattar endast aktiva obetalda reservationer. API:t registrerar inget betalsätt; visa därför inte beloppet som kontanter.

#### Sidhuvud i `AdminBookings`
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
   - Kort 2 (`#10B981`): `Förväntad intäkt` — backendens `expectedRevenue` — `{paidRevenue} kr betalt`.
   - Kort 3 (`#F59E0B`): `Beläggning` — `{occupancy}%` — `{soldSeats}/{totalSeats} platser` (Exempeldata: `78%`, `62/80 platser`).
3. **Visningsfilter:**
   - Etikett: `Filtrerar visning:` (desktop) / `Filtrerar visning` (mobil).
   - Dropdown (`<select>`) med 7 visningsalternativ i `SCREENING_OPTIONS` (Exempeldata, förvald: `Idag 18:00 — Stjärnornas Krig: Arvet, Salong 1`).
   - På desktop visas till höger en grön prick (`8×8px`, `#10B981`) och texten `Live`.
4. **Bokningslista (Tabell på desktop, kortlista på mobil):**
   - På mobil visas räknetexten `{filteredBookings.length} bokningar visas` ovanför korten.
   - **Tabellkolumner på desktop:** `Bokningsnr` | `Kund` | `Film & Tid` | `Salong` | `Platser / Biljetter` | `Belopp` | `Åtgärd`.
   - **Fält på mobilkort (`BookingCard`):** Bokningskod, statusbadge enligt verksamhetsreglerna (`Betald`, `Reserverad – obetald`, `Reservationen har släppts`, `Avbokad`) och separat incheckningsstatus, `Kund`, `Salong`, `Film & Tid`, `Belopp`, `Platser` samt knapparna `Markera betald` (eller `✓ Betald`) och `Avboka`.
   - **Interaktioner:**
     - Klick på `Markera betald` anropar betalnings-API:t. Efter lyckat svar visas `confirmed`/`isPaid: true` som `Betald`; incheckningsstatus ändras bara genom en uttrycklig incheckningsåtgärd. KPI:er och platskarta laddas om.
     - `Avboka` kräver bekräftelse, motivering och det framtida admin-API:t enligt ovan. En avbokad rad ska markeras som avbokad och kunna visas i historikfilter; ingen lokal radering eller hårdradering av bokningen.
   - **Tomt tillstånd (`filteredBookings.length === 0`):** `Inga bokningar hittades.`
5. **Höger sidopanel (endast desktop, `width: 256px` / `w-64`):**
   - **Kort 1 – Live salongskarta:**
     - Rubrik: `Salongskarta — live`, underrubrik: `Salong 1 · 18:00 visning` (Exempeldata).
     - Renderar `MiniSeatMap` med legend: `Ledig` (`#334155`), `Bokad` (`#E50914`), `Inväntar` (`#10B981`).
     - Beläggningsmätare under avdelare: `Beläggning` / `{occupancy}%`, progressbar (`#E50914` om > 80 %, `#F59E0B` om > 50 %, annars `#10B981`) samt texten `{soldSeats} bokade · {totalSeats - soldSeats} lediga`.
   - **Kort 2 – Kassaöversikt:**
     - Rubrik: `Kassaöversikt`.
     - Rader:
       - `Kvar att betala`: `backendens obetalda aktiva belopp` (`#F59E0B`)
       - `Redan betalat`: `{totalRevenue} kr` (`#10B981`)
       - `Totalt idag`: `{total summa} kr` (`#F8FAFC`)

