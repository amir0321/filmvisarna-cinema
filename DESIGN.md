# Filmvisarna – Designsammanfattning

> Baserad på Figma-prototypen "File Upload Feature" (design_01–design_23, totalt 23 vyer inklusive mobil)  
> Senast verifierad: 2026-10-19

---

## 1. Övergripande designspråk

| Egenskap | Värde |
|---|---|
| Färgschema | Mörkt tema (`#111` / `#1a1a2e` bakgrund, mörkgrå kort) |
| Primärfärg (CTA) | Röd/orange-röd — `Bli Medlem`, `Boka Biljett`, `Checka in`, etc. |
| Accentfärg | Röd text för rubriker / highlights (`Film är bäst på riktig bio`) |
| Typografi | Vit/ljusgrå text på mörk bakgrund; fetstil för rubriker |
| Kortdesign | Rundade hörn, mörk bakgrund (#1e2030 / #252540), subtil border |
| Badges / pills | Åldergränsbadge (röd), genrebadge (grå pill), statusbadge (grön/gul/röd) |
| Knappar | Röd fylld (primär), mörk outline (sekundär), text-länk |
| Navigation | Sticky topbar med logotyp, navlänkar, sökikon, "Logga in" + "Bli Medlem" |

---

## 2. Sidor – Publik frontend

### 2.1 Startsida (`/` eller `/hem`)

**Design_01 · Design_02 · Design_03**

#### Hero-sektion
- Helskärms bakgrundsbild (filmstill)
- Vänsterjusterad text: genre-badge · åldersgräns-badge · speltid
- Filmtitel (stor vit rubrik)
- Kort synopsis (max 2–3 rader, trunkerad med `...`)
- Två CTA-knappar: `▶ Se Trailer` (outline) + `Boka Biljett >` (röd)

#### Filter-strip (under hero)
- **DATUM**: `Idag` · `Imorgon` · `I helgen` · kalenderikon
- **ÅLDERSGRÄNS**: `Alla` · `Barntillåten` · `7 år` · `11 år` · `15 år`
- Aktiv pill: röd bakgrund, övriga: mörk pill

#### Repertoar-sektion
- Rubrik `Repertoar — Idag`
- Filmkort i grid (4 kolumner desktop):
  - Porträttbild täcker kortet
  - Åldersbadge (röd, övre vänster)
  - Titel + speltid + regissör + genre-pills
  - Visningstider som pills: `13:00 · Stora`, `18:00 · Stora`, `20:30 · Lilla (6 kvar)`
  - "X kvar" i parenteser vid låg tillgång

#### Footer
- Logotyp + adress: Stortorget 12, 572 31 Småstad, Tel: 0491-123 45
- Öppettider: Mån–Tor 13–23, Fre–Lör 11–01, Sön 11–22
- Information: "Betalning sker alltid på plats i kassan vid ankomst."
- Länkar: Integritetspolicy · Cookie-inställningar · Admin

---

### 2.2 Filmer & Repertoar (`/filmer`)

**Design_04**

#### Sidans struktur
- Rubrik: **Filmer & Repertoar**
- Undertext: `Vad vill du se? Vi spelar nu 8 filmer på FILMVISARNA.`
- Tabbar: `På bio nu` | `Kommande premiärer 4` (badge med antal)

#### Sök & filter
- Sökfält: `Sök film eller genre...` + sorteringsväljare (`Mest populär ▾`)
- Genre-filter (pill-rad): `Alla` · `Action` · `Animation` · `Drama` · `Fantasy` · `Krim` · `Romance` · `Sci-Fi` · `Thriller` · `Western`
- Åldersgräns-filter: `Alla` · `Barntillåten` · `7 år` · `11 år` · `15 år`
- Datum-filter: `Idag (1 okt)` · `Imorgon (2 okt)` · `Fredag (3 okt)` · `Lördag (4 okt)`

#### Filmkort (horisontell scroll / grid)
- Visar `Visar 8 av 8 filmer`
- Landskapsbild + åldersbadge (övre vänster) + speltid (övre höger, halvtransparent)
- IMDb-betyg med stjärna (t.ex. `★ 8.4 IMDb`)
- Filmtitel + genre-pills + visningstider per salong

---

### 2.3 Filmdetaljsida (`/filmer/:id`)

**Design_17 (Järnhjärtat)**

#### Hero & Bakgrund
- Stor landskapsbild / bakgrundsvideo med mörk gradient
- Centrerad Play-ikon (`▶`) för att spela filmtrailer i overlay
- Vänster kolumn: Högupplöst filmomslag (vertikal poster) med rundade hörn
- Höger kolumn (Filminformation):
  - Badges: Genre-pills i versaler (`ACTION` · `SCI-FI`) samt IMDb-betyg (`★ 7.5 IMDb` med gul stjärna)
  - Filmtitel: Stor vit rubrik (`Järnhjärtat`)
  - Regissör: `Regi: [Regissörsnamn]`
  - Synopsis: Fyllig sammanfattning av handlingen
  - Medverkande: `MEDVERKANDE` med skådespelarnamn som pills/chips

#### Nedre sektion (2 kolumner)
- **Vänster kolumn – FAKTA-kort:**
  - Tabell/lista med filmdata:
    - Åldersgräns (t.ex. `15 år`)
    - Premiärår (t.ex. `2026`)
    - Speltid (t.ex. `2h 8m`)
    - Originaltitel (t.ex. `Iron Heart`)
    - Språk (t.ex. `Engelska`)
    - Undertexter (t.ex. `Svenska`)
- **Höger kolumn – Visningstider & Dagväljare ("Välj dag & tid"):**
  - Datum-pills: `Idag (1 okt)` (aktiv) · `Imorgon (2 okt)` · `Fredag (3 okt)`
  - Visningskort per salong under valt datum:
    - Tidintervall: `17:30 – 19:38`, Salong: `Salong 1`, Tillgänglighet: badge `33 kvar` (grön)
    - Tidintervall: `21:00 – 23:08`, Salong: `Salong 2`, Tillgänglighet: badge `8 kvar` (röd)
  - Notering i botten: *"Välj en tid ovan för att gå vidare till stolsväljaren. Betalning sker i kassan."*

---

### 2.4 Bokningsflöde & Stolsväljare (`/boka/:visningId`)

**Design_18 · Design_19**

#### Sidhuvud & Stegindikator
- Brödsmula: `< [Filmtitel]` (länk tillbaka till filmen)
- Stegindikator centrerad i toppen:
  - `1. Biljetter` (grön cirkel med bock `✓`)
  - `2. Välj platser` (aktiv, röd cirkel med siffra 2 och röd indikatorlinje)
  - `3. Bekräftelse` (grå cirkel med siffra 3)
- Mini-sammanfattning av föreställningen:
  - Liten poster-thumbnail · Titel (`Stjärnornas Krig: Arvet`) · Salong (`Stora Salongen`) · Tid (`13:00–15:45 • 2D`)

#### Vänster kolumn – Steg 1: Välj biljetter
- Rubrik: **1. Välj biljetter** — *"Välj antal biljetter per kategori"*
- Biljettkategorier med plus/minus-räknare:
  - `Vuxen 140 kr` `[-] 1 [+]`
  - `Pensionär 120 kr` `[-] 0 [+]`
  - `Barn (under 12 år) 80 kr` `[-] 1 [+]` (röd plusknapp)
- Sammanfattningsrad (grön banner): `Totalt: 220 kr för 2 biljetter ✓`

#### Vänster kolumn – Steg 2: Välj platser
- Rubrik: **2. Välj platser** — *"Bästa tillgängliga platser är förvalda — klicka för att ändra"*
- Stolskarta:
  - Välvd skärmillustration i toppen: `BIODUK`
  - Radbeteckningar `A`–`J` på både vänster och höger sida
  - Stolar ordnade per rad med visuell status:
    - **Ledig:** Mörkgrå rundad knapp
    - **Vald:** Grön rundad knapp med vit stol-ikon
    - **Upptagen:** Mörkgrå rundad knapp med snedstreck (`/`)
  - Teckenförklaring (Legend) under kartan:
    - `Ledig` (grå box) · `Vald` (grön box med ikon) · `Upptagen` (grå med snedstreck)

#### Kiosktillägg – Bio-Kiosken (hopfällbar accordion under stolskartan)
- Rubrik: **Bio-Kiosken – Förbeställ snacks & slipp kön!** (popcorn-ikon + expander-pil `^`)
- Undertext: *"Hämta ut färska snacks i kassan samtidigt som du betalar dina biljetter."*
- Produkter med kvantitetsväljare `[-] [antal] [+]`:
  - 🍿 **Klassikern** – Mellanpopcorn & 50cl Läsk (79 kr)
  - 🍿 **Stora Biomyset** – Stor Popcorn & 2× Läsk + Godispåse (129 kr)
  - ☕ **Kaffepaket** – Kaffe/Te & Nybakad Kaka

#### Höger kolumn – Sticky sammanfattning ("Din bokning")
- Salong och valda platser: `Stora Salongen` · `Rad E, Stol 1 · Rad E, Stol 2`
- Prisspecifikation:
  - `1× Vuxen 140 kr`
  - `1× Barn 80 kr`
  - `Totalt 220 kr` (stor fet vit text)
- Betalningsinformation: *"Ingen onlinebetalning krävs. Biljetterna betalas och hämtas ut i kassan senast 15 minuter innan föreställningen börjar."*
- Fält för bokningsbekräftelse:
  - Etikett: `E-post för bokningsbekräftelse`
  - Inmatningsfält med placeholder: `din@epost.se`
- Medlemstips (infobox):
  - *"💡 Tips: Bli medlem så sparas dina bokningar automatiskt under Mina sidor!"*
- CTA-knapp: `Slutför bokning` (stor fylld röd knapp)
- Länk under knappen (om kiosken är stängd): `🍿 Lägg till snacks från Bio-Kiosken`

---

### 2.5 Bokningsbekräftelse & Digital Biljett (`/bekraftelse/:kod`)

**Design_20 · Design_21**

#### Bekräftelsevy ("Tack för din bokning!")
- Centrerat modal/kort med mörk bakgrund och subtil border:
  - Stor grön cirkel med vit bock (`✓`)
  - Rubrik: **Tack för din bokning!**
  - Undertext: *"En bekräftelse skickas till din e-post"*
- **Bokningskod-box:**
  - Etikett: `BOKNINGSKOD`
  - Monospace-box med koden: `FV - H7UZQ`
  - Snabbknapp: `[ Kopiera ]` (med kopiera-ikon)
- **Biljettsammanfattning:**
  - Film-thumbnail · Titel (`Stjärnornas Krig: Arvet`) · Salong (`Stora Salongen`) · Tid (`13:00–15:45`)
  - Platsinfo: `Rad E: Stol 1, 2`
  - Specifikation:
    - `1× Vuxen (140 kr) 140 kr`
    - `1× Barn (80 kr) 80 kr`
    - `Biljetter 220 kr`
    - Skiljelinje
    - `Totalt att betala 220 kr` (belopp i accentgrön)
- **QR-kod för incheckning:**
  - Etikett: `Visa upp vid kassan`
  - Centrerad QR-kod som kodar bokningsreferensen
  - Kodtext under QR: `FV-H7UZQ`

#### Digital biljett & Hantering (kvitto / avbokning)
- Under QR-koden finns åtgärdsknappar:
  - `Skriv ut / Spara som PDF` (mörkgrå knapp / outline)
  - `Avboka biljett` (röd border / röd text)
  - `Tillbaka till startsidan` (textlänk)

---

### 2.6 Salonger (`/salonger`)

**Design_05 · Design_06**

#### Sidhuvud
- Supertitel: `FILMVISARNA SMÅSTAD` (röd pill)
- Rubrik: **Våra Salonger**
- Undertext: "Två salonger med det bästa i ljud och bild…"

#### Salong-kort (sida vid sida)
| | Salong 1 | Salong 2 |
|---|---|---|
| Smeknamn | Stora Salongen | Lilla Salongen |
| Platser | 80 | 40 |
| Chip/badges | 80 platser (röd) · 4K Laser · Dolby Atmos | 40 platser (grön) · 2D · Stereo |
| Egenskaper | 4K Laser Projektor, Dolby Atmos Ljud, Bred duk (18m), Rullstolsplatser (rad A), Barservering tillgänglig | 2D Digital Projektor, Premium Fåtöljer, Intim atmosfär, Rullstolsplatser (rad A), Familjevänlig |
| Badge (övre höger) | Premiärsalong | Bekväma fåtöljer |
| Tillgänglighet-badge | ♿ Tillgänglig | ♿ Tillgänglig |
| CTA | `Se schema →` (röd, full bredd) | `Se schema →` (röd, full bredd) |

#### Salongskarta (inbäddad i kortet)
- Enkel platskarta med färgkodning:
  - ○ Ledig
  - ● Exempelval (röd/orange)
  - ● Rullstol (blå)

#### Tillgänglighet & Rullstolsplatser (sektion)
- Bred ingång utan tröskel
- Ramp till alla salonger
- Tillgängliga toaletter i foajén
- Induktionsslinga för hörselhjälpmedel

#### Dukens placering (sektion)
| | Stora salongen | Lilla salongen |
|---|---|---|
| Duk | 18 × 8 m | 10 × 4,5 m |
| Optimal sittrad | Rad D–G | – |
| Öppningsår | 1987 | 2019 |

---

### 2.7 Om oss (`/om-oss`)

**Design_07 · Design_08 · Design_09**

#### Hero
- Supertitel: `OM OSS` (röd pill med ikon)
- Rubrik: **Filmvisarna – Film är bäst på riktig bio**
- Undertext: "En lokal, oberoende biograf i Småstad…"
- Dekorativ pil (höger)

#### Vår historia (sektion)
- Underrubrik: `VÅR HISTORIA`
- Rubrik: **En biograf som bryr sig om sina gäster**
- Löptext (2 stycken)
- Tre feature-kort (höger kolumn):
  - 🎬 **Trygg bokning** – reservera favoritstoler, betala vid ankomst
  - 🎬 **Modern salongsteknik** – 4K Laser + Dolby Atmos
  - 🎬 **Senior- & Matinérabatt** – förmånliga priser

#### Bio-Kiosken (sektion)
- Supertitel: `VÅR KIOSK & FÖRBESTÄLLNING`
- Rubrik: **Bio-Kiosken – Småstads bästa biogodis**
- Tre produktkort:
  | Produkt | Beskrivning | Pris |
  |---|---|---|
  | 🍿 Klassikern | Varma mellanpopcorn + 50cl kall läsk | 79 kr |
  | 🍿 Stora Biomyset | Stora popcorn, 2× dryck + godispåse | 129 kr |
  | ☕ Småstads Kaffepaket | Nybryggt kaffe/te & lokal kaka | 49 kr |

#### Våra Salonger (sektion på Om oss)
- Salong 1: 80 platser · `4K · Dolby Atmos`
- Salong 2: 40 platser · `2D · Intimt`

#### Hitta hit & kontakt (sektion)
- Rubrik: **Välkommen till Storgatan 14**
- Kartvy (placeholder/grid)
- Info-ikoner:
  - 📍 ADRESS: Storgatan 14, Småstad
  - 🕐 ÖPPETTIDER: Kassan och kiosken öppnar 45 min före första visning
  - 🚗 PARKERING: Gratis parkering bakom biografen efter 18:00
- Kontaktformulär (höger):
  - Fält: **DITT NAMN** · **E-POSTADRESS** · **MEDDELANDE**
  - CTA: `Skicka meddelande` (röd, full bredd)

---

## 3. Sidor – Inloggade användare

### 3.1 Mina Bokningar (`/mina-bokningar`)

**Design_10**

#### Nav (inloggad)
- Navlänk `Mina Bokningar` visas (med notis-badge `1`)
- Avatar-meny övre höger: namn + e-post
- Rullgardin: `Min profil` · `Logga ut`

#### Profilkort (övre del)
- Avatar (stor röd cirkel med initial)
- Namn + e-post
- Roll-badge: `Medlem` (grön pill)

#### Flikar
- `Aktuella bokningar 1` | `Bokningshistorik`

#### Bokningskort
- Statusbadge: `Kommande föreställning` + `🍿 Kiosk förbeställd`
- Bokningsnummer: `FV-YRZ4V` (övre höger)
- Filmaffish (liten, vänster)
- Filmtitel · Salong · Tid · Platser
- Kostnadsspec: Biljetter · Kiosk · **Totalt att betala** (markerat)
- Förbeställd kiosk: `1× 🍿 Klassikern – 79 kr`
- Knappar: `Visa biljett` (outline) + `Avboka` (röd outline)

---

### 3.2 Min Profil (`/profil`)

**Design_11**

#### Layout (2-kolumn)
**Vänster panel:**
- Avatar (gradient cirkel med initial + redigera-ikon)
- Namn, e-post, `● Aktiv medlem`
- Stats: `1 Bokningar` · `240 Poäng`
- Sidolista: `Mina uppgifter` (aktiv) · `Säkerhet` · `Bokningshistorik`

**Höger panel – Personuppgifter:**
- Fält: FÖRNAMN · EFTERNAMN · E-POSTADRESS (med `VERIFIERAD`-badge) · TELEFONNUMMER
- CTA: `Spara ändringar` (röd)

---

## 4. Admin – Backoffice

Tillgänglig via `/admin` eller footer-länk. Separat navigationsbar.

### Admin-navigation
```
FILMVISARNA • BACKOFFICE | Bokningar & Kassa | Visningsschema | Filmarkiv | Salonger | Kiosksortiment | [Avatar] Admin: Ameer (Superadmin) | Logga ut
```

---

### 4.1 Bokningar & Kassa (`/admin/bokningar`)

**Design_12**

#### Stats-rad
| Kortnyckel | Exempelvärde |
|---|---|
| Dagens bokningar | 8 st (4 inväntar · 4 betalda) |
| Förväntad intäkt | 2 200 kr (1 000 kr betalt) |
| Beläggning | 78% (62/80 platser) |

#### Snabb incheckning
- Sökfält: `Sök bokningsnummer (t.ex. FV-8K49P) eller kundens e-post...`
- Knapp: `✓ Checka in` (röd)

#### Filter
- Dropdown: `Idag 18:00 — Stjärnornas Krig: Arvet, Salong 1` · `● Live`

#### Bokningstabell
Kolumner: BOKNINGSNR · KUND · FILM & TID · SALONG · PLATSER / BILJETTER · BELOPP · ÅTGÄRD

Statuspills:
- `✓ Betald` (grön)
- `Inväntar` + `✓ Markera betald` (knapp)
- `Avboka` (röd outline)
- `🍿 Kiosbeställning` (orange badge)

#### Höger panel – Salongskarta Live
- Mini-salongskarta med färgkodning: Ledig · Bokad · Inväntar
- Beläggning: X% + bokade/lediga platser

#### Kassaöversikt
- Kontant att ta emot: XX kr
- Redan betalat: XX kr
- Totalt idag: XX kr

---

### 4.2 Visningsschema (`/admin/visningar`)

**Design_13**

#### Filter-knappar
`Idag` (röd aktiv) · `Imorgon` · `Hela veckan`

#### CTA
`+ Schemalägg ny visning` (röd, övre höger)

#### Tabell
Kolumner: DATUM · STARTTID · SALONG · FILM · FORMAT · SÅLDA PLATSER · SLUTTID · STATUS · ÅTGÄRDER

- Sålda platser visas som `XX / 80` + progress-bar (grön)
- Salong-badge: `Salong 1` (röd) · `Salong 2` (blå/lila)
- Status: `Aktiv` (grön badge)
- Åtgärder: `✏ Redigera` · `Ställ in` (röd)

---

### 4.3 Filmarkiv (`/admin/filmer`)

**Design_14**

#### Sök + CTA
- Sökfält: `Sök filmtitel eller regissör...` · `8 filmer`
- `+ Lägg till ny film` (röd, övre höger)

#### Tabell
Kolumner: AFFISCH · TITEL · ÅLDERSGRÄNS · SPELTID · REGISSÖR · VISNINGAR · ÅTGÄRDER

- Affisch: liten thumbnail (fyrkantig, rundade hörn)
- Genre-pills under titeln (t.ex. `Sci-Fi · Äventyr`)
- Åldersgräns-badge (röd vid 15 år, grön vid Alla)
- Åtgärder: `✏ Redigera` · `Ta bort` (röd pill)

**Exempelfilmer i designen:**
- Stjärnornas Krig: Arvet · Djupet · Väktarnas Dal · Sommaren Vi Försvann · Järnhjärtat · Lille Björnens Stora Äventyr · Nattens Arkitekt · Röd Sand

---

### 4.4 Salonger – Admin (`/admin/salonger`)

**Design_15**

#### Statistikrad
`2 salonger · 120 platser totalt`

#### CTA
`+ Lägg till ny salong` (röd, övre höger)

#### Salongskortet (admin-vy)
Varje kort visar:
- Namn + platser-badge
- Stats: Rader · Stolar/rad · Format · Teknik
- Platskarta: `SALONGSKARTA — NUMRERING HÖGER TILL VÄNSTER`
- Format-badges: `2D` · `4K` · `Dolby Atmos` (Salong 1) / `2D` (Salong 2)
- Rullstolsplatser: `Rad A: Stol 1, 10` / `Rad A: Stol 1, 8`
- Knappar: `✏ Redigera rader & stolar` · `🗑 Ta bort` (röd)

| | Salong 1 | Salong 2 |
|---|---|---|
| Rader | 8 | 5 |
| Stolar/rad | 10 | 8 |
| Format | 2D+ | 2D |
| Teknik | 4K | Digital |

---

### 4.5 Kiosksortiment (`/admin/kiosk`)

**Design_16**

#### Stats-kort
| Kort | Värde |
|---|---|
| Totalt sortiment | 8 st |
| Aktiva produkter | 7 st |
| Synliga i förbokning | 3 st |

#### Filter
- Sökfält: `Sök på produktnamn eller beskrivning...`
- Kategoriknappar: `Alla` · `Menyer & Paket` · `Popcorn & Snacks` · `Dryck` · `Godis` · `Fika`

#### CTA
`+ Lägg till ny produkt/meny` (röd, övre höger)

#### Produkttabell
Kolumner: BILD · PRODUKTNAMN · KATEGORI · PRIS · LAGERSTATUS · ÅTGÄRDER

| Produkt | Kategori | Pris | Status |
|---|---|---|---|
| 🍿 Klassikern | Menyer & Paket | 79 kr | Aktiv ✓ |
| 🍿 Stora Biomyset | Menyer & Paket | 129 kr | Aktiv ✓ |
| ☕ Småstads Kaffepaket | Fika | 49 kr | Aktiv ✓ |
| 🍿 Stor Popcorn | Popcorn & Snacks | 55 kr | Aktiv ✓ |
| 🍿 Liten Popcorn | Popcorn & Snacks | 35 kr | Aktiv ✓ |
| 🥤 Cola 50cl | Dryck | 35 kr | Aktiv ✓ |
| 💧 Vatten 50cl | Dryck | 25 kr | Slut i lager ○ |

- Toggle-switch för aktiv/inaktiv status
- `🍿 I förbokning`-badge på produkter som kan väljas vid bokning
- Åtgärder: `✏ Redigera` · 🗑 (röd ikon)

---

## 5. Roller & behörigheter

| Roll | Tillgång |
|---|---|
| **Gäst** | Startsida, Filmer, Salonger, Om oss (ej inloggad) |
| **Medlem** | + Mina bokningar, Min profil, kassa vid ankomst |
| **Admin / Superadmin** | + Backoffice (alla sektioner ovan) |

---

## 6. Återkommande UI-komponenter

### Navigation – Publik
```
FILMVISARNA •  |  Hem  Filmer & Repertoar  Salonger  Om oss  |  🔍  Logga in  [Bli Medlem]
```
- Aktiv länk: understreck + vit text
- "Bli Medlem" = röd fylld knapp

### Navigation – Inloggad
```
...  Mina Bokningar¹  |  🔍  [A Ameer ▾]
```

### Navigation – Admin (Backoffice)
```
FILMVISARNA • BACKOFFICE  |  Bokningar & Kassa  Visningsschema  Filmarkiv  Salonger  Kiosksortiment  |  [A Admin: Ameer (Superadmin)]  Logga ut
```

### Navigation – Mobil (Viewport ≤ 768px, t.ex. iPhone SE 375×667)

**Design_22 · Design_23**

#### Mobil Topbar
```
FILMVISARNA •                                         ☰  👤
```
- Logo till vänster
- Hamburgarmeny-ikon (`☰`) och Användar-avatar (`👤`) till höger

#### Mobil Bottom Navigation Bar (Fast klistrad i botten)
Fyra navigeringsflikar med ikoner:
- `🏠 Hem` (aktiv: röd ikon + text)
- `🎬 Filmer`
- `🎟 Biljetter`
- `👤 Profil`

#### Mobil Sidomeny / Drawer (öppnas via hamburgarikonen `☰`)
- **Toppsektion:**
  - Användaravatar (röd cirkel, t.ex. `G` för Gäst eller initial)
  - Namn/status: `Gäst` (undertitel: `Inte inloggad`)
  - Stängknapp: `✕` (övre höger i drawern)
- **Menylista (vertikal):**
  - `🏠 Hem` (aktiv: rundad röd container-bakgrund)
  - `🗓 Filmer & Repertoar`
  - `💺 Salonger`
  - `🎟 Mina Bokningar`
  - `👤 Min Profil`
  - `ℹ Om oss`
  - `🗄 Admin Backoffice` (med röd pill-badge `ADMIN`)
- **Knappar i botten av menyn:**
  - `Logga in` (stor röd CTA-knapp)
  - `Logga ut` (mörk konturknapp)

### Bokningsnummer-format
`FV-XXXXX` (2 bokstäver + bindestreck + 5 alfanumeriska tecken, ex. `FV-8K49P`, `FV-YRZ4V`)

### Åldersgränsbadgar
| Gräns | Färg |
|---|---|
| Alla | Grön |
| Barntillåten | Grön |
| 7 år | Gul/orange |
| 11 år | Orange |
| 15 år | Röd |

### Salong-badge (admin-tabell)
- `Salong 1` = röd pill
- `Salong 2` = blå/lila pill

### Platskarta (legend)
- ○ Ledig (ljusgrå)
- ● Exempelval / Bokad (röd/orange)
- ● Rullstol (blå)
- ● Inväntar (gul) — visas i admin live-vy

---

## 7. Krav som framgår ur designen (ej implementerade ännu)

- [ ] **Filmuppladdning / affisch-bild** – Admin kan ladda upp affischbild vid "Lägg till ny film" (Figma-projektnamnet "File Upload Feature" pekar på detta)
- [ ] **Kiosk-produktbild** – BILD-kolumnen i Kiosksortiment visar emoji/ikon; möjligt att ladda upp riktig bild
- [ ] **Trailer-länk** – "Se Trailer"-knappen på startsidans hero kräver URL till trailer
- [ ] **Kommande premiärer-flik** – `Kommande premiärer 4` visas men innehållet saknas i designbilderna
- [ ] **Sökfunktion** – Sökikon i navbaren verkar stödja global sökning
- [ ] **Notis-badge** på `Mina Bokningar` – visar antal aktiva bokningar

---