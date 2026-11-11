# Bokningssäkerhet och skydd mot missbruk

Detta är ett gällande projektbeslut för nya boknings-, gäst- och adminfunktioner. Det har företräde framför prototypens bokningsflöde. Se också [Backend/README.md](../Backend/README.md) för driftsättning och API.

## Publik bokning – implementerat

- Medlemmar måste vara inloggade och ha verifierad e-post. Backend hämtar identitet och verifieringsstatus från databasen; klientens e-post, roll och verifieringsflagga är inte behörighetsbevis.
- Gäster skickar en bokningsförfrågan med `POST /api/bookings/guest/request`. Den lagras separat i `guest_booking_intent`, aldrig som en obekräftad rad i `booking` eller `ticket`.
- Gästförfrågan reserverar inga platser. UI och mejl visar: `Platserna reserveras först när du har bekräftat bokningen.` Länken gäller i högst 10 minuter. Bekräftad bokning betalas i kassan enligt befintlig kassapolicy.
- Förhandsvisning görs med `POST /api/bookings/guest/preview`. Att öppna länken skapar ingen bokning. Kunden måste uttryckligen klicka på `Bekräfta bokning`, vilket anropar `POST /api/bookings/guest/confirm`.
- Ledighet, visningens starttid, biljettkategorier, priser, kioskvaror och samtliga kvoter kontrolleras igen när bokningen bekräftas. Om platserna tagits kan gästen välja andra inom samma visning och giltighetstid.
- Gästtoken är slumpmässiga, ändamålsbundna och begränsade till den aktuella bokningen. Enbart hash lagras. Länken använder URL-fragment som tas bort ur historiken; token sparas bara i komponentminne och skickas i POST-kroppen. Token, mejllänkar och mottagaruppgifter får inte skrivas till applikationsloggar.
- En giltig token kan skapa högst en bokning. Återförsök av samma lyckade begäran ger samma bokning. Ändrat innehåll med en redan använd nyckel avvisas. En gästtoken ger inte konto-, medlems- eller adminåtkomst.

## Gemensamma gränser

Standardvärden är konfigurerbara i backend, och kontrollerna gäller även direkta API-anrop:

| Kontroll | Standard |
| --- | --- |
| Bokningsförsök per verifierad identitet | 3 / 15 minuter |
| Publika bokningsanrop per IP | 30 / 15 minuter |
| Publika bokningsanrop totalt | 300 / 15 minuter |
| Sammanlagda platser till samma visning | 10 |
| Aktiva, obetalda bokningar | 3 |
| Sammanlagda platser i aktiva, obetalda bokningar | 20 |
| Gästmejl per adress | 3 / 15 minuter, minst 60 sekunder mellan utskick |
| Gästmejl totalt | 60 / 15 minuter |
| Aktiva gästförfrågningar per adress | 1 |
| Giltighet för gästlänk | Högst 10 minuter |

- E-post normaliseras med trimning och gemener. Samma verifierade adress delar kvot för gäst- och medlemsbokningar. Olika leverantörers aliasregler antas inte vara identiska.
- En IP-gräns är ett extra skydd. VPN/IP-byte nollställer inte identitetskvoter, och en VPN-adress är inte i sig grund för blockering. E-postverifiering bevisar tillgång till en brevlåda, inte en unik fysisk person.
- Antalskontroll och skapande sker i samma databastransaktion med gemensam identitetslåsning. Stolarnas databasunikhet ska behållas som ytterligare skydd mot dubbelbokning.
- Betalda platser räknas fortfarande mot visningens tioplatsgräns. Avbokade bokningar och visningar som redan börjat räknas inte som aktiva. Gamla bokningar behålls vid migrering; nya bokningar kan nekas om identiteten redan ligger över en kvot.
- Boknings- och förfrågningsinskick använder `Idempotency-Key` (UUID). Samma nyckel ska återanvändas vid återförsök av samma val; nya val får ny nyckel.
- Gränser kontrolleras i gemensam PostgreSQL-lagring, över serverinstanser och omstarter. `429` visar ett svenskt meddelande. Nekade kvoter återställs inte genom utloggning, flikbyte eller IP-byte.
- Verifieringsmejl för medlemskonton har också högst tre utskick per 15 minuter och minst en minut mellan utskick. Omskick får inte skapa en bokning.
- Ingen ny bokningsförfrågan godkänns om nödvändig e-posttjänst saknas. Misslyckade gästutskick lämnar inga platser eller övergivna förfrågningar. Dubbletter skickar inte nya mejl eller förlänger länken.
- Utgångna gästförfrågningar och spärrposter städas regelbundet. Säkerheten får inte bero på att städjobbet körts: utgångna länkar avvisas alltid vid anrop. Bekräftade bokningar städas inte bort av detta jobb.

## Åtskillnad och framtida adminarbete – krav, inte implementerad adminfunktion

Detta avsnitt är bindande när adminarbetet genomförs senare. Ingen ny adminvy eller missbrukshantering ingår i nuvarande ändring.

- Gästförfrågningar, bekräftade bokningar och betalningsstatus ska vara separata begrepp. Väntande/utgångna gästförfrågningar får inte blandas in i vanliga bokningslistor, beläggning, biljettantal, kassasiffror eller intäktsstatistik.
- Om en separat administrativ vy för gästförfrågningar införs ska den ha ett eget, serverkontrollerat admin-API och en begränsad datamodell. Den får inte exponera token, tokenhash, mejllänkar eller inloggningsuppgifter. Publika gästendpoints får aldrig lista andra kunders förfrågningar.
- Flaggning ska kunna visa ovanligt många bokningar, stora mängder obetalda platser, återkommande kvotöverträdelser och upprepad bokning/avbokning. Flaggan ska bygga på beteende och förklarbara kriterier, inte enbart VPN eller delad IP-adress.
- Behörig personal ska kunna granska och avboka misstänkta bokningar så att platserna blir tillgängliga igen. Adminavbokning ska vara en uttrycklig, separat åtgärd från kundens avbokningsflöde och ha tydlig bekräftelse och motivering. Betalda bokningar och eventuella återbetalningsregler måste hanteras uttryckligen i den framtida specifikationen.
- Frigörande av platser och uppdatering av bokningsstatus ska ske atomärt. Betalnings-, kiosk- och statistikuppgifter ska fortsätta vara konsekventa.
- Varje administrativ åtgärd ska verifiera `requireAdmin` på servern och logga administratör, tid, bokningsreferens, åtgärd och motivering i en skyddad granskningslogg. Råa token och onödiga personuppgifter får inte loggas.
- Administrativa undantag från publika kvoter får endast införas genom en separat, uttryckligen auktoriserad och loggad funktion. Rollen `admin` i en klientpayload får aldrig ge undantag.

## Framtida platsreservationer

Nuvarande gästförfrågan håller inga platser. En eventuell framtida reservation ska kräva verifierad identitet, gälla högst 10 minuter, begränsas till en per identitet och räknas mot platskvoterna. Utgångna reservationer ska omedelbart sluta blockera platser även när ett städjobb ligger efter. En sådan ändring kräver en separat databas- och tillgänglighetsspecifikation.
