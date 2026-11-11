# Sprint 4-demo fredag 13 november 2026

Alla tider nedan gäller Stockholm. Använd de befintliga filmerna och salongerna.

| Scenario | Fredag 13 november | Söndag 15 november | Förberett läge |
| --- | --- | --- | --- |
| Dune: Part Two | 10.00, visning 303 | 10.00, visning 315 | 77 bokade, D4/D5/H9 lediga |
| Interstellar | 14.00, visning 304 | 14.00, visning 316 | 80 bokade, fullbokat |
| Inception | 18.00, visning 305 | 18.00, visning 317 | 80 lediga före provbokningar |

Välj söndagens visningar under demon. De ligger i framtiden hela fredagen och kan avbokas enligt tvåtimmarsregeln.

1. Visa fullbokningsbeskedet för Interstellar: `/boka/316`.
2. Visa Dunes tre lediga platser: `/boka/315`. D4 och D5 ligger intill varandra, H9 är separat. Boka inte de sista platserna under provkörning om ni vill behålla läget.
3. Gör hela bokningen med två vuxna och kiosk på Inception: `/boka/317`. Visa bokningsnummer, Mina bokningar, biljett och avbokning.

## Mejl under redovisningen

- Förbered ett konto vars riktiga e-postadress har verifierats före redovisningen. Kontoverifieringen gäller en gång per konto. Länken gäller i 24 timmar och användaren måste klicka på **Bekräfta e-postadress** på sidan.
- De befintliga testkontona `medlem@filmvisarna.se` och `testuser1@example.com` var inte verifierade vid förberedelsen. Deras konton, lösenord och verifieringsstatus har inte ändrats.
- Huvuddemo: boka inloggad med ett redan verifierat konto. Bokningen bekräftas direkt på sajten. Ett separat bokningsbekräftelsemejl skickas efteråt, men inget ytterligare mejlklick krävs för varje medlemsbokning.
- Gästdemo: ange en inkorg ni själva kan öppna, begär bokningslänken under demon, öppna mejlet och klicka sedan **Bekräfta bokning** på sajten. Länken gäller i 10 minuter. Platserna reserveras först när bokningen bekräftas, och någon annan kan hinna boka dem innan dess.
- Ha den egna inkorgen redo om ni vill visa gästflödet. Förbered inga gästlänkar flera dagar i förväg. Mejlens länkar måste öppna samma demoversion som ni visar.
- SMTP-inställningar finns. Verklig mejlleverans har inte provkörts i denna förberedelse och måste kontrolleras före fredag.
- Kontot får ha högst tre kommande obetalda bokningar. Avboka egna provbokningar efter repetitionen så att gränsen inte stoppar demon.

## Förberedelsens omfattning

`Backend/sql/demo/20261113_sprint4.sql` kördes mot projektets befintliga databas. Skriptet lade bara till fiktiv, betald demopublik på de fyra angivna Dune-/Interstellar-visningarna. Inga mejl skickades. Inga befintliga konton eller bokningar raderades eller ändrades.

Tillgängligheten kontrollerades i databasen och på sajten: Interstellar visade **Visningen är fullbokad**, och Dune visade **3 platser kvar**. Siffrorna förändras om någon därefter bokar eller avbokar platser. SQL-filen kan köras igen utan dubbletter; den avbryter om de tre avsedda lediga stolarna redan har bokats.
