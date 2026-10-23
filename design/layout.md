> Bygger på: [tokens.md](tokens.md), [components.md](components.md) · Tillbaka till index: [DESIGN.md](../DESIGN.md) · Se även: [flows.md](flows.md) · [coverage.md](coverage.md)

## 4. Layout och navigering

### 4.1 Applikationsskal (`PublicLayout.tsx` & `AdminLayout.tsx`)

- **Rot-container:** `min-height: 100vh` (`min-vh-100`), `background: $fv-bg` (`#0B0F19`), textfärg `$fv-fg` (`#F8FAFC`).
- **Gemensamt skal och header för publik hemsida och Admin:**
  - Både den publika hemsidan (`PublicLayout.tsx`) och administrationspanelen (`AdminLayout.tsx`) använder **samma design och header-struktur**:
    1. `Navbar` (klibbig toppnavigering, `height: 64px`, `.app-navbar`)
    2. `MobileDrawer` (utfällbar sidomeny från höger på `< 768px`, `#mobileDrawer`)
    3. `<main className="flex-grow-1 container-fluid px-3 px-md-5 pt-4 public-main">` (`padding-bottom: 64px` på `< 768px` för att ge plats åt `BottomNav`)
    4. Sidfot (`footer.public-footer` med `margin-bottom: 64px` på `< 768px`, `0` på `>= 768px`)
    5. `BottomNav` (fast bottennavigering på `< 768px`, `height: 64px`)
- **Källfiler:** `Frontend/src/layouts/PublicLayout.tsx`, `Frontend/src/layouts/AdminLayout.tsx`.

### 4.2 Toppnavigering (`Navbar.tsx` & `BrandLogo.tsx`)

- **Placering och yta (`.app-navbar`):** `position: sticky`, `top: 0`, `z-index: $fv-z-fixed` (`50`), höjd `64px` (`$fv-nav-height`). Bakgrund `$fv-nav-bg` (`rgba(11, 15, 25, 0.9)`), `backdrop-filter: blur(14px)`, `border-bottom: 1px solid $fv-border` (`rgba(148, 163, 184, 0.15)`).
- **Container (`.nav-container`):** Maxbredd `1280px` (`$fv-container-7xl`), centrerad (`margin: 0 auto`), responsiv horisontell padding (`16px` på bas/`md`, `24px` vid `>= 1024px` `$fv-bp-lg`, `32px` vid `>= 1280px` `$fv-bp-xl`). Vänster (`.nav-brand-group`) och höger (`.nav-actions-group`) sektion har `flex-shrink: 0` så att länkar eller knappar aldrig trycks ut ur skärmen när fönstret minskas.
- **Vänster – Logotyp (`BrandLogo.tsx`):**
  - Klickbar länk (`to="/"`) med texten `FILMVISARNA` (`Poppins`, `16px` / `1rem`, `font-weight: 700`, `letter-spacing: 0.18em`, `#F8FAFC`, `uppercase`) följt av en röd cirkel via `::after` (`6×6px`, `border-radius: 50%`, `#E50914`, `margin-bottom: 6px`).
  - Inne i `/admin` visas även badgen `ADMIN` (`.nav-admin-badge`, `d-none d-lg-inline-block`: `10px`, `uppercase`, bakgrund `rgba(229, 9, 20, 0.15)`, text `#E50914`, `padding: 2px 6px`, `border-radius: 4px`) bredvid logotypen på `>= 992px`.
- **Mitten – Desktop-länkar (`d-none d-md-flex`, visas vid `>= 768px`, `.nav-links-list` med `gap: 2px`, `min-width: 0`, `overflow-x: auto`):**
  - **På vanliga hemsidan (publik vy):**
    1. `Hem` (`/`, `end: true`)
    2. `Filmer & Repertoar` (`/movies`)
    3. `Salonger` (`/salonger`)
    4. `Om oss` (`/om-oss`)
    5. `Mina Bokningar` (`/my-bookings`, visas endast när användaren är inloggad)
    6. `Admin` + badge `ADMIN` (`/admin`, visas endast när `user.role === 'admin'`)
  - **Inne i Admin (`/admin/*`):**
    - Använder exakt samma `.public-nav-link`-design med konsekventa etiketter på alla skärmstorlekar (och ikoner på `>= 1200px`):
    1. `Bokningar` (`/admin/bookings`, ikon `bi-ticket-perforated`)
    2. `Schema` (`/admin/screenings`, ikon `bi-calendar3`)
    3. `Filmer` (`/admin/movies`, ikon `bi-film`)
    4. `Salonger` (`/admin/cinemas`, ikon `bi-display`)
    5. `Till biografen` (`/`, ikon `bi-box-arrow-left`, för att växla tillbaka till den publika hemsidan)
  - **Utseende och tillstånd (`.public-nav-link`):** `white-space: nowrap`, `flex-shrink: 0`, `border-radius: 8px`, `font-weight: 500`, `padding: 6px 8px` och `font-size: 13px` (`0.8125rem`) vid `768px–1023px`, samt `padding: 8px 12px` (`8px 16px` vid `>= 1280px`) och `font-size: 14px` (`0.875rem`) vid `>= 1024px`.
    - **Aktiv (`.active`):** Text `#F8FAFC` (`$fv-fg`), bakgrund `rgba(248, 250, 252, 0.07)`.
    - **Inaktiv:** Text `#94A3B8` (`$fv-muted-fg`), bakgrund `transparent`. Vid hover: text `#F8FAFC`.
- **Höger – Åtgärder (`gap: 8px`):**
  - **Sökknapp (`.nav-search-btn`):** `36×36px`, `border-radius: 8px`, bakgrund `rgba(255, 255, 255, 0.04)`, ikon `bi-search` i `#94A3B8` (`aria-label="Sök"`, `title="Kommer snart"`, `disabled`).
  - **Desktop (`>= 768px`, `d-none d-md-flex`):**
    - **Utloggad (Gäst):**
      1. **`Logga in`-länk (`.nav-login-btn`):** Navigerar till `/login`. `padding: 8px 16px`, `border-radius: 8px`, `font-size: 14px`, `font-weight: 500`, kantlinje `1px solid rgba(148, 163, 184, 0.25)`, text `#94A3B8` (aktiv: `#F8FAFC` och bakgrund `rgba(248, 250, 252, 0.07)`).
      2. **`Bli Medlem`-länk (`.nav-register-btn`):** Navigerar till `/register`. `padding: 8px 16px`, `border-radius: 10px` (`$fv-radius-md`), `font-size: 14px`, `font-weight: 600`, bakgrund `#E50914` (`$fv-primary`), vit text.
    - **Inloggad (Medlem & Admin):**
      - **Avatar-dropdown (`.nav-avatar-btn`):** Rundad knapp (`border-radius: $fv-radius-pill`, `border: 1px solid $fv-border`, bakgrund `rgba(255, 255, 255, 0.04)`) med cirkelavatar (`.nav-avatar-circle`, `30×30px`, `linear-gradient(135deg, #E50914 0%, #7C3AED 100%)`, initialer i `Poppins` `12px` `font-weight: 700`).
      - **Dropdown-meny (`.nav-user-dropdown`):** Bakgrund `#161F30` (`$fv-card-bg`), `border: 1px solid $fv-border`, `border-radius: 12px` (`$fv-radius-xl`), `min-width: 210px`. Visar visningsnamn + e-post i huvudet, länkar till `Min Profil` (`/profile`), `Mina Bokningar` (`/my-bookings`), (samt `Admin Backoffice` `/admin` eller `Till biografen` `/` för admin), avdelare och `Logga ut` (`.nav-dropdown-logout` i `#ff6b6b`).
  - **Mobil (`< 768px`, `d-flex d-md-none`):**
    - **Hamburgermeny-knapp (`.nav-hamburger-btn`):** `padding: 8px`, `border-radius: 8px`, färg `#94A3B8`, `aria-label="Öppna meny"`, ikon `bi-list` (`20px`). Öppnar `#mobileDrawer` via Bootstrap Offcanvas.
- **Källfiler:** `Frontend/src/components/Navbar.tsx`, `Frontend/src/components/BrandLogo.tsx`, `Frontend/src/styles/_navigation.scss`.

### 4.3 Admin-navigering (Samma header som vanliga hemsidan)

- Admin har **ingen separat admin-topbar** från Figma-prototypen. I stället använder `/admin` samma `Navbar`, `MobileDrawer` och `BottomNav` som den vanliga hemsidan:
  - **Header (`Navbar.tsx`):** Samma höjd (`64px`), bakgrund (`.app-navbar`), container (`1280px`), logotyp (`BrandLogo` + `ADMIN`-badge), `.public-nav-link`-knappar och högerställda kontroller (sökknapp, avatar-dropdown på desktop, hamburgerknapp på mobil).
  - **Desktop-länkar i `/admin`:** `Bokningar` (`/admin/bookings`), `Schema` (`/admin/screenings`), `Filmer` (`/admin/movies`), `Salonger` (`/admin/cinemas`) samt `Till biografen` (`/`).
  - **Mobil i `/admin` (`< 768px`):** Använder samma `MobileDrawer` och `BottomNav` som övriga sidor, där `BottomNav` och `MobileDrawer` visar admin-länkarna när man befinner sig i `/admin`.

### 4.4 Mobil bottennavigering (`BottomNav.tsx`)

- **Synlighet:** Renderas på mobil (`< 768px`, `d-flex d-md-none`) i både `PublicLayout` och `AdminLayout`.
- **Placering och yta (`.bottom-nav`):** `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `z-index: $fv-z-fixed` (`50`), `height: 64px` (`$fv-bottom-nav-height`), bakgrund `#161F30` (`$fv-card-bg`), `border-top: 1px solid rgba(148, 163, 184, 0.12)`, `box-shadow: $fv-shadow-bottom-nav` (`0 -4px 24px rgba(0, 0, 0, 0.4)`).
- **Flikar (4 st med `flex: 1`, `.bottom-nav-item`):**
  - **Utloggad gäst på publika sidor (`GUEST_TABS`):**
    1. `Hem` (`/`, `bi-house-door` / `bi-house-door-fill`)
    2. `Filmer` (`/movies`, `bi-film`)
    3. `Salonger` (`/salonger`, `bi-display` / `bi-display-fill`)
    4. `Om oss` (`/om-oss`, `bi-info-circle` / `bi-info-circle-fill`)
  - **Inloggad användare på publika sidor (`AUTH_TABS`):**
    1. `Hem` (`/`, `bi-house-door` / `bi-house-door-fill`)
    2. `Filmer` (`/movies`, `bi-film`)
    3. `Biljetter` (`/my-bookings`, `bi-ticket-perforated` / `bi-ticket-perforated-fill`)
    4. `Profil` (`/profile`, `bi-person` / `bi-person-fill`)
  - **Inne i Admin (`ADMIN_TABS` på `/admin/*`):**
    1. `Bokningar` (`/admin/bookings`, `bi-ticket-perforated` / `bi-ticket-perforated-fill`)
    2. `Schema` (`/admin/screenings`, `bi-calendar3`)
    3. `Filmer` (`/admin/movies`, `bi-film`)
    4. `Salonger` (`/admin/cinemas`, `bi-display` / `bi-display-fill`)
- **Tillstånd:**
  - **Aktiv (`.active`):** Ikon (`22px` / `1.375rem`) och etikett (`10px` / `0.625rem`, `font-weight: 600`) i `#E50914` (`$fv-primary`), samt en röd linjeindikator högst upp i fliken (`.bottom-nav-indicator`: `position: absolute`, `top: 0`, `left: 20%`, `right: 20%`, `height: 2px`, `background: #E50914`, `border-radius: 0 0 2px 2px`).
  - **Inaktiv:** Ikon och etikett (`10px`, `font-weight: 400`) i `#94A3B8` (`$fv-muted-fg`).
- **Källfil:** `Frontend/src/components/BottomNav.tsx`.

### 4.5 Mobil sidomeny (`MobileDrawer.tsx`)

- **Komponent:** Bootstrap Offcanvas (`.offcanvas.offcanvas-end.mobile-drawer`, `#mobileDrawer`) som glider in från höger och rensar eventuella kvarhängande `.offcanvas-backdrop` vid unmount.
- **Backdrop (`.offcanvas-backdrop`):** `z-index: 997` (`$fv-z-drawer - 1`), `backdrop-filter: blur(2px)`.
- **Panel (`.mobile-drawer`):** `z-index: 998` (`$fv-z-drawer`), `width: 80vw`, `max-width: 320px`, bakgrund `#0F1729` (`$fv-drawer-bg`), `border-left: 1px solid $fv-border`.
- **Struktur uppifrån och ned:**
  1. **Header (`.mobile-drawer-header`, `padding: 20px 20px 16px`, `border-bottom: 1px solid rgba(148, 163, 184, 0.1)`):**
     - Övre rad med `BrandLogo` till vänster och stäng-knapp (`.drawer-close-btn`, `32×32px`, `border-radius: 8px`, bakgrund `rgba(255, 255, 255, 0.06)`, `bi-x-lg` i `#94A3B8`, `aria-label="Stäng meny"`) till höger.
     - Undre rad med cirkulär avatar (`.drawer-avatar`, `44×44px`, `.drawer-avatar-guest` i röd gradient för gäst eller `.drawer-avatar-user` i röd-lila gradient för inloggad) med initialer (`18px`, `Poppins`, `font-weight: 700`), visningsnamn (`.drawer-user-name`, `14px`, `font-weight: 600`, `#F8FAFC`) och status/e-post undertill (`.drawer-user-status`, `12px`, `#94A3B8`, visar e-post eller `'Inte inloggad'`).
  2. **Navigationslänkar (`.drawer-nav`, `padding: 12px`):**
     - Länkar (`.drawer-nav-link`, `padding: 14px 12px`, `border-radius: 10px`, `font-size: 15px`, ikon `20px` + etikett):
       - **På vanliga hemsidan:** `Hem` (`/`), `Filmer & Repertoar` (`/movies`), `Salonger` (`/salonger`), `Om oss` (`/om-oss`), samt för inloggade `Mina Bokningar` (`/my-bookings`) och `Min Profil` (`/profile`). Om `user.role === 'admin'` visas en avdelare (`.drawer-divider`) och länken `Admin Backoffice` (`/admin`) med ikon `bi-layers` och badge `ADMIN`.
       - **Inne i `/admin`:** Visar admin-länkarna `Översikt` (`/admin`), `Bokningar & Kassa` (`/admin/bookings`), `Visningsschema` (`/admin/screenings`), `Filmarkiv` (`/admin/movies`), `Salonger` (`/admin/cinemas`), en avdelare (`.drawer-divider`) samt `Till biografen` (`/`), `Mina Bokningar` (`/my-bookings`) och `Min Profil` (`/profile`).
     - **Aktivt tillstånd (`.active`):** Bakgrund `rgba(229, 9, 20, 0.1)`, text `#E50914`, `font-weight: 600`, `border-left: 2px solid #E50914`.
     - **Inaktivt tillstånd:** Bakgrund `transparent`, text `#94A3B8`, `font-weight: 400`, `border-left: 2px solid transparent`.
  3. **Footer-knappar (`.drawer-footer`, `padding: 16px 12px 32px`, `border-top: 1px solid rgba(148, 163, 184, 0.1)`, `gap: 8px`):**
     - **Inloggad:** `Logga ut` (`.drawer-logout-btn`, röd outline-knapp, `border: 1px solid rgba(229, 9, 20, 0.4)`, text `#E50914`, `padding: 12px`, `border-radius: 10px`).
     - **Utloggad (Gäst):** `Logga in` (`.drawer-login-outline-btn`, sekundär outline-knapp till `/login`) och `Bli Medlem` (`.drawer-login-btn`, primär röd knapp `#E50914` till `/register`).
- **Källfil:** `Frontend/src/components/MobileDrawer.tsx`.

### 4.6 Sidfot (`Footer`)

- **Placering:** Global sidfot längst ned i `PublicLayout.tsx` och `AdminLayout.tsx` (`.public-footer`, `border-top`, bakgrund `#161F30` / `.bg-card`, `margin-bottom: 64px` på `< 768px` för att inte täckas av `BottomNav`).
- **Innehåll (utökad 3-kolumnslayout enligt designspec):**
  - **Kolumn 1 – Varumärke & Kontakt:** `FILMVISARNA Småstad`, `Stortorget 12`, `572 31 Småstad`, `Tel: 0491-123 45`.
  - **Kolumn 2 – Öppettider:** `Mån–Tor: 13.00–23.00`, `Fre–Lör: 11.00–01.00`, `Sön: 11.00–22.00`.
  - **Kolumn 3 – Information:** Notisruta `Betalning sker alltid på plats i kassan vid ankomst.` (Ingen oautentiserad demo-länk till Admin i sidfoten för icke-admins).

### 4.7 Grid och Responsivt beteende

- **Brytpunktslogik:**
  - Applikationen använder Bootstrap 5-brytpunkter och SCSS-variablerna `$fv-bp-sm` (`640px`), `$fv-bp-md` (`768px`), `$fv-bp-lg` (`1024px`) och `$fv-bp-xl` (`1280px`).
  - Vid `< 768px` aktiveras mobilvy i både publik vy och admin: `BottomNav` visas i nederkant, `main` och `footer` anpassar sitt bottenavstånd (`64px`), och desktop-länkarna i `Navbar` ersätts av hamburgermenyn som öppnar `MobileDrawer`. I admin-vyerna byts datatabeller mot staplade mobilkort och modaler byts mot `BottomSheet`.
- **Horisontell scroll på små skärmar:** Filterrader samt den interaktiva salongskartan ligger i horisontellt scrollbara containers (`overflow-x: auto`).


