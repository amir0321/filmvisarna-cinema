> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md) (3.1 Knappar, 3.3 Badges, 3.4 Bokningskort, 3.6 Formulär & PasswordStrength, 3.8 Tabbar, 3.9 Inline-feedback), [design/layout.md](../layout.md) och [design/flows.md](../flows.md). Index: [DESIGN.md](../../DESIGN.md).

### 5.9 Min Profil (`ProfilScreen`)

- **Föreslagen route:** `/profil` (Föreslagen)
- **Skärm-ID:** `'profil'`
- **Källfil:** `src/components/ProfilScreen.tsx`

#### Struktur uppifrån och ned (`max-width: 1024px` / `max-w-5xl`, `padding: 80px 16px 88px`)
1. **Sidhuvud (`margin-bottom: 32px`):**
   - Tillbaka-knapp med vänsterpil och texten `Tillbaka` (`13px`, `#94A3B8`, navigerar till `'home'`).
   - **Rubrik (`h1`):** `Min Profil` (`28px`, `Poppins`, `font-weight: 700`).
   - **Underrubrik:** `Hantera ditt konto och bokningar` (`14px`, `#94A3B8`).
2. **Tvåkolumnslayout (`lg:grid lg:grid-cols-[1fr_2fr]`, `gap: 32px`):**
   - **Vänster sidopanel:**
     - **Användarkort (`#161F30`, `border-radius: 16px`, `padding: 24px`):**
       - `Avatar` (`80×80px`, `linear-gradient(135deg, #E50914 0%, #7C3AED 100%)`, initialer `{initials || 'G'}`, med rund redigera-knapp `26×26px` med pennikon nere till höger).
       - Visningsnamn: `{firstName} {lastName}` eller `Gäst` om fälten är tomma (`16px`, `font-weight: 600`).
       - E-post: `{email}` (förifyllt med `gast@example.com` — Exempeldata).
       - Grön status-pill: grön prick (`6×6px`) + `Aktiv medlem` (`12px`, `#10B981`, bakgrund `rgba(16, 185, 129, 0.1)`).
       - Horisontell avdelare + 2 små statistikrutor (`grid-template-columns: 1fr 1fr`, `gap: 12px`):
         - `Bokningar`: `{upcoming.length + past.length}`
         - `Poäng`: `240` (Exempeldata)
     - **Vertikal flikmeny på desktop (`hidden lg:flex`, `#161F30`, `border-radius: 16px`, `margin-top: 16px`):**
       1. `Mina uppgifter` (`id: 'uppgifter'`)
       2. `Säkerhet` (`id: 'sakerhet'`)
       3. `Bokningshistorik` (`id: 'historik'`)
   - **Höger innehållspanel:**
     - **Horisontell flikmeny på mobil (`flex lg:hidden`, `#161F30`, `border-radius: 10px`, `padding: 4px`):** Samma 3 flikar (`Mina uppgifter`, `Säkerhet`, `Bokningshistorik`).
     - **Flik 1 – `Mina uppgifter` (`#161F30`, `border-radius: 16px`, `padding: 28px`):**
       - Rubrik (`h2`): `Personuppgifter` (`18px`, `Poppins`, `font-weight: 600`).
       - 2-kolumnsrad (`1fr 1fr`, `gap: 16px`):
         - `Förnamn` (placeholder: `Ditt förnamn`)
         - `Efternamn` (placeholder: `Ditt efternamn`)
       - `E-postadress` (förifyllt `gast@example.com`, med grön badge `VERIFIERAD` inuti fältets högerkant).
       - `Telefonnummer` (placeholder: `+46 70 000 00 00`).
       - Knapprad: Primär knapp `Spara ändringar` (visar grön bockikon + `Sparat!` i 2,5 sekunder vid klick).
     - **Flik 2 – `Säkerhet` (`#161F30`, `border-radius: 16px`, `padding: 28px`):**
       - Rubrik (`h2`): `Lösenord & Säkerhet` (`18px`, `Poppins`, `font-weight: 600`).
       - Tre lösenordsfält (alla med placeholder `••••••••` och visa/dölj-ögonikon till höger):
         1. `Nuvarande lösenord`
         2. `Nytt lösenord` (med `PasswordStrength`-indikator: `Svagt`, `Okej`, `Starkt`, `Mycket starkt`)
         3. `Bekräfta nytt lösenord`
       - Hjälptext (`12px`, `#94A3B8`):
         - `Lösenordet måste vara minst 8 tecken och innehålla minst en stor bokstav, en siffra och ett specialtecken.`
       - Sekundär outline-knapp: `Uppdatera lösenord` (ingen klick-handler i prototypen).
     - **Flik 3 – `Bokningshistorik`:**
       - Underflikar (`gap: 4px`, `margin-bottom: 20px`): `Kommande visningar` (statiskt aktiv i rött) och `Tidigare besök` (inaktiv).
       - **Tomt tillstånd (`upcoming.length === 0`):** Kort med emoji `🎬` (`40px`), text `Inga bokningar att visa ännu.` och primär knapp `Utforska filmer` (navigerar till `'filmer'`).
       - **Bokningslista (`upcoming.length > 0`):** Kort med poster, `{movie.title}`, `{time} · {auditorium}`, röd bokningskodsbadge `{bookingRef}`, grön badge `Bekräftad` och `60×60px` mini-QR-kod.

