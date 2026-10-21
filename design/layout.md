> Bygger på: [tokens.md](tokens.md), [components.md](components.md) · Tillbaka till index: [DESIGN.md](../DESIGN.md) · Se även: [flows.md](flows.md) · [coverage.md](coverage.md)

## 4. Layout och navigering

### 4.1 Applikationsskal (`App.tsx`)

- **Rot-container:** `min-height: 100vh`, `background: var(--background)` (`#0B0F19`).
- **Publikt skal (`!isAdminScreen`, dvs. alla skärmar utom `admin`):**
  - Renderar `Nav` (toppnavigering), `MobileDrawer` (utfällbar sidomeny), `<main className="pb-16 md:pb-0">` (`padding-bottom: 64px` på `< 768px` för att ge plats åt `BottomNav`, `0` på `>= 768px`), `BottomNav` samt `CookieBanner` (om `showCookie === true`).
- **Admin-skal (`screen === 'admin'`):**
  - Döljer `Nav`, `MobileDrawer`, `BottomNav` och `CookieBanner`. Renderar i stället `AdminScreen` som har sin egen fasta toppbar.
- **Källfil:** `src/App.tsx`.

### 4.2 Publik toppnavigering (`Nav.tsx`)

- **Placering och yta:** `position: fixed`, `top: 0`, `left: 0`, `right: 0`, `z-index: 50`, höjd `64px` (`h-16`). Bakgrund `rgba(11, 15, 25, 0.9)`, `backdrop-filter: blur(14px)`, `border-bottom: 1px solid rgba(148, 163, 184, 0.15)`.
- **Container:** Maxbredd `1280px` (`max-w-7xl`), horisontell padding `20px` (`px-5`), `32px` vid `>= 640px` (`sm:px-8`), `64px` vid `>= 1024px` (`lg:px-16`).
- **Vänster – Logotyp:** Klickbar knapp (navigerar till `home`) med texten `FILMVISARNA` (`Poppins`, `16px`, `font-weight: 700`, `letter-spacing: 0.18em`, `#F8FAFC`, `uppercase`) följt av en röd cirkel (`6×6px`, `border-radius: 50%`, `#E50914`, `margin-bottom: 10px`).
- **Mitten – Desktop-länkar (`hidden md:flex`, visas vid `>= 768px`, `gap: 2px`):**
  1. `Hem` (`screen: 'home'`, aktiv vid `['home']`)
  2. `Filmer & Repertoar` (`screen: 'filmer'`, aktiv vid `['filmer', 'detail', 'seats', 'confirm']`)
  3. `Salonger` (`screen: 'salonger'`, aktiv vid `['salonger']`)
  4. `Mina Bokningar` (`screen: 'bookings'`, aktiv vid `['bookings']`)
  - **Utseende och tillstånd:** `padding: 8px 16px` (`px-4 py-2`), `border-radius: 8px`, `font-size: 14px`, `font-weight: 500`.
    - **Aktiv:** Text `#F8FAFC`, bakgrund `rgba(248, 250, 252, 0.07)`.
    - **Inaktiv:** Text `#94A3B8`, bakgrund `transparent`. Vid hover (`onMouseEnter`): text `#F8FAFC`.
- **Höger – Åtgärder (`gap: 8px`):**
  - **Desktop (`>= 768px`):**
    1. **Sökknapp:** `36×36px` (`w-9 h-9`), `border-radius: 8px`, bakgrund `rgba(255, 255, 255, 0.04)`, förstoringsglasikon `16×16px` i `#94A3B8` (har ingen klick-handler kopplad i prototypen).
    2. **`Logga in`-knapp:** Klick navigerar till `profil`. `padding: 8px 16px`, `border-radius: 8px`, `font-size: 14px`, `font-weight: 500`, kantlinje `1px solid rgba(148, 163, 184, 0.25)`. Om `currentScreen === 'profil'`: text `#F8FAFC` och bakgrund `rgba(248, 250, 252, 0.07)`, annars `#94A3B8` och `transparent`.
    3. **`Bli Medlem`-knapp:** `padding: 8px 16px`, `border-radius: 10px`, `font-size: 14px`, `font-weight: 600`, bakgrund `#E50914`, vit text (har ingen klick-handler kopplad i prototypen).
  - **Mobil (`< 768px`, `md:hidden`):**
    1. **Hamburgermeny-knapp:** `padding: 8px`, `border-radius: 8px`, färg `#94A3B8`, `aria-label="Öppna meny"`, ikon `20×20px`. Öppnar `MobileDrawer`.
    2. **Profilknapp:** `padding: 6px`, `border-radius: 9999px`, bakgrund `rgba(255, 255, 255, 0.08)`, färg `#94A3B8`, användarikon `16×16px`. Navigerar till `profil`.
- **Publik vs. Inloggad status i `Nav.tsx`:** Prototypen har ingen separat inloggad header-vy i `Nav.tsx`, utan visar alltid `Logga in` och `Bli Medlem` på desktop.
- **Källfil:** `src/components/Nav.tsx`.

### 4.3 Admin-toppnavigering (`AdminScreen.tsx`)

- **Placering och yta:** `position: fixed`, `top: 0`, `left: 0`, `right: 0`, `z-index: 50`, bakgrund `rgba(11, 15, 25, 0.95)`, `backdrop-filter: blur(14px)`, `border-bottom: 1px solid rgba(148, 163, 184, 0.12)`.
- **Huvudrad (`height: 56px`, maxbredd `1600px`, padding `0 40px` desktop / `0 16px` mobil):**
  - **Vänster:** Klickbar logotyp `FILMVISARNA` (`Poppins`, `14px` desktop / `13px` mobil, `font-weight: 700`, `letter-spacing: 0.16em`) + röd prick (`5×5px`) + badge `Backoffice` (endast desktop: `10px`, `uppercase`, bakgrund `rgba(229, 9, 20, 0.15)`, text `#E50914`, `padding: 2px 7px`, `border-radius: 5px`). Klick navigerar tillbaka till `home`.
  - **Mitten (endast desktop, `!isMobile`):** Horisontell flikrad med 4 flikar:
    1. `Bokningar & Kassa` (`id: 'bokningar'`)
    2. `Visningsschema` (`id: 'schema'`)
    3. `Filmarkiv` (`id: 'filmarkiv'`)
    4. `Salonger` (`id: 'salonger'`)
  - **Höger:**
    - **Användarbricka (endast desktop):** Container (`padding: 6px 12px`, `border-radius: 10px`, bakgrund `rgba(255, 255, 255, 0.06)`, kantlinje `1px solid var(--border)`) med röd cirkelavatar `A` (`24×24px`, `#E50914`), primär text `Admin: Ameer` (`11px`, `font-weight: 600`) och sekundär text `Superadmin` (`10px`, `#94A3B8`).
    - **Utloggningsknapp:** `padding: 7px 12px` (`7px 10px` mobil), `border-radius: 8px`, kantlinje `1px solid var(--border)`, bakgrund `rgba(255, 255, 255, 0.04)`, text `#94A3B8`, utloggningsikon (`14×14px`) + text `Logga ut` (desktop) eller `Ut` (mobil). Klick navigerar till `home`.
- **Mobil flikrad (andra rad i toppbaren vid `isMobile`, `< 768px`):**
  - Horisontellt scrollbar rad med `border-top: 1px solid rgba(148, 163, 184, 0.08)`. Visar ikon + kort etikett (`Bokningar`, `Schema`, `Filmer`, `Salonger`).
- **Källfil:** `src/components/AdminScreen.tsx`.

### 4.4 Mobil bottennavigering (`BottomNav.tsx`)

- **Synlighet:** Renderas endast när `window.innerWidth < 768` och skärmen inte är `admin`.
- **Placering och yta:** `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `z-index: 50`, `height: 64px`, bakgrund `#161F30`, `border-top: 1px solid rgba(148, 163, 184, 0.12)`, `box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4)`.
- **Flikar (4 st med `flex: 1`):**
  1. `Hem` (`screen: 'home'`, husikon `22×22px`)
  2. `Filmer` (`screen: 'filmer'`, filmklappa-ikon `22×22px`)
  3. `Biljetter` (`screen: 'bookings'`, biljettikon `22×22px`)
  4. `Profil` (`screen: 'profil'`, användarikon `22×22px`)
- **Tillstånd:**
  - **Aktiv (`currentScreen === screen`):** Ikon och text (`10px`, `font-weight: 600`) i `#E50914`, fylld ikonvariant (för Hem, Filmer, Biljetter), samt en röd linjeindikator högst upp i fliken (`position: absolute`, `top: 0`, `left: 20%`, `right: 20%`, `height: 2px`, `background: #E50914`, `border-radius: 0 0 2px 2px`).
  - **Inaktiv:** Ikon (outline-variant) och text (`10px`, `font-weight: 400`) i `#94A3B8`.
- **Källfil:** `src/components/BottomNav.tsx`.

### 4.5 Mobil sidomeny (`MobileDrawer.tsx`)

- **Beteende:** Låser sidscroll (`document.body.style.overflow = 'hidden'`) när `open === true`.
- **Backdrop:** `position: fixed`, `inset: 0`, `z-index: 998`, `background: rgba(0, 0, 0, 0.6)`, `backdrop-filter: blur(2px)`, `transition: opacity 0.25s ease`. Klick stänger menyn.
- **Panel:** `position: fixed`, `top: 0`, `right: 0`, `bottom: 0`, `z-index: 999`, `width: 80vw`, `max-width: 320px`, bakgrund `#0F1729`, `border-left: 1px solid rgba(148, 163, 184, 0.12)`, glider in från höger (`translateX(100%)` -> `translateX(0)`, `0.3s cubic-bezier(0.4, 0, 0.2, 1)`).
- **Struktur uppifrån och ned:**
  1. **Header (`padding: 20px 20px 16px`, `border-bottom: 1px solid rgba(148, 163, 184, 0.1)`):**
     - Cirkulär avatar (`44×44px`, `linear-gradient(135deg, #E50914 0%, #B2070F 100%)`) med bokstaven `G` (`18px`, `Poppins`, `font-weight: 700`, vit).
     - Text: `Gäst` (`14px`, `font-weight: 600`, `#F8FAFC`) och undertill `Inte inloggad` (`12px`, `#94A3B8`).
     - Stäng-knapp till höger (`32×32px`, `border-radius: 8px`, bakgrund `rgba(255, 255, 255, 0.06)`, kryssikon `16×16px` i `#94A3B8`).
  2. **Navigationslänkar (`padding: 12px`):**
     - 5 huvudlänkar (`padding: 14px 12px`, `border-radius: 10px`, `font-size: 15px`, ikon `20×20px` + etikett):
       - `Hem` (`screen: 'home'`)
       - `Filmer & Repertoar` (`screen: 'filmer'`)
       - `Salonger` (`screen: 'salonger'`)
       - `Mina Bokningar` (`screen: 'bookings'`)
       - `Min Profil` (`screen: 'profil'`)
     - **Aktivt tillstånd:** Bakgrund `rgba(229, 9, 20, 0.1)`, text `#E50914`, `font-weight: 600`, `border-left: 2px solid #E50914`.
     - **Inaktivt tillstånd:** Bakgrund `transparent`, text `#94A3B8`, `font-weight: 400`, `border-left: 2px solid transparent`.
     - **Avdelare:** Horisontell linje (`height: 1px`, `background: rgba(148, 163, 184, 0.1)`, `margin: 12px 0`).
     - **Adminlänk:** `Admin Backoffice` (`screen: 'admin'`) med lager-ikon (`20×20px`) och högerställd badge `ADMIN` (`10px`, `font-weight: 600`, `padding: 2px 6px`, `border-radius: 4px`, bakgrund `rgba(229, 9, 20, 0.15)`, text `#E50914`).
  3. **Footer-knappar (`padding: 16px 12px 32px`, `border-top: 1px solid rgba(148, 163, 184, 0.1)`, `gap: 10px`):**
     - `Logga in` (primär knapp, bakgrund `#E50914`, vit text, `padding: 12px`, `border-radius: 10px` — navigerar till `profil` och stänger menyn).
     - `Logga ut` (sekundär röd outline-knapp, `border: 1px solid rgba(229, 9, 20, 0.4)`, text `#E50914`, `padding: 12px`, `border-radius: 10px` — ingen klick-handler).
- **Källfil:** `src/components/MobileDrawer.tsx`.

### 4.6 Sidfot (`Footer` i `HomeScreen.tsx`)

- **Obs:** Sidfoten är i prototypen endast inlagd längst ned i `HomeScreen.tsx` (inte som en global komponent i `App.tsx`).
- **Yta:** `margin-top: 64px` (`mt-16`), `border-top: 1px solid var(--border)`, bakgrund `#161F30` (`var(--card)`).
- **Layout:** Maxbredd `1280px`, `padding: 48px 16px` (`py-12 px-4 sm:px-6 lg:px-8`), 1 kolumn på mobil och 3 kolumner vid `>= 640px` (`grid-cols-1 sm:grid-cols-3`, `gap: 32px`).
- **Kolumn 1 – Varumärke & Kontakt:**
  - Röd ikonruta (`28×28px`, `border-radius: 6px`, `#E50914`) med vit filmremsa-ikon (`16×16px`) + rubrik `FILMVISARNA Småstad` (`Poppins`, `font-weight: 700`).
  - Adresstext (`14px`, `#94A3B8`, radbrytningar):
    - `Stortorget 12`
    - `572 31 Småstad`
    - `Tel: 0491-123 45`
- **Kolumn 2 – Öppettider:**
  - Rubrik: `Öppettider` (`14px`, `font-weight: 600`, `#F8FAFC`, `margin-bottom: 12px`).
  - Text (`14px`, `#94A3B8`):
    - `Mån–Tor: 13.00–23.00`
    - `Fre–Lör: 11.00–01.00`
    - `Sön: 11.00–22.00`
- **Kolumn 3 – Information & Länkar:**
  - Rubrik: `Information` (`14px`, `font-weight: 600`, `#F8FAFC`, `margin-bottom: 12px`).
  - Notisruta (`padding: 12px`, `border-radius: 8px`, bakgrund `rgba(255, 255, 255, 0.04)`, kantlinje `1px solid var(--border)`, `14px`, `#94A3B8`):
    - `Betalning sker alltid på plats i kassan vid ankomst.`
  - Länkrad (`margin-top: 16px`, `gap: 12px`, `font-size: 12px`, understrukna knappar):
    - `Integritetspolicy` (`#94A3B8`, ingen klick-handler)
    - `Cookie-inställningar` (`#94A3B8`, ingen klick-handler)
    - `Admin` (`rgba(148, 163, 184, 0.4)`, navigerar till `admin`)
- **Källfil:** `src/components/HomeScreen.tsx`.

### 4.7 Grid och Responsivt beteende

- **Brytpunktslogik:**
  - Prototypen kombinerar CSS-mediaqueries (Tailwind `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`) med JavaScript-hooken `useIsMobile(768)` (`src/hooks/useIsMobile.ts`).
  - Vid `< 768px` aktiveras mobilvy: `BottomNav` visas i nederkant, `main` får `padding-bottom: 64px`, desktop-länkarna i `Nav` ersätts av hamburger- och profilknapp, och i `AdminScreen` byts tabeller mot kortlistor och modaler i `SchemaTab`/`FilmarkivTab` byts mot `BottomSheet`.
- **Horisontell scroll på små skärmar:** Filterrader (`FilmerScreen`, `MovieDetailScreen`, `SchemaTab`), mobilflikar i `AdminScreen` samt den interaktiva salongskartan i `SeatSelectionScreen` ligger i horisontellt scrollbara containers (`overflow-x: auto`).

