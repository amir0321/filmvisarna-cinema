> Tillbaka till index: [DESIGN.md](../DESIGN.md) · Se även: [tokens.md](tokens.md) · [components.md](components.md) · [layout.md](layout.md) · [flows.md](flows.md)

## 11. Täckningslista

Prototypens 28 filer under `docs/figma-make/src/` är inventerade enligt tabellen nedan. Tabellen är en prototypreferens; uppdaterade specifikationer för den implementerade appen använder källfiler i `Frontend/` och `Backend/`. Aktuell koppling för film- och adminarbetet finns efter tabellen.

| # | Källfil i `docs/figma-make/src/` | Dokumenterad i sektion(er) i `DESIGN.md` |
| :--- | :--- | :--- |
| 1 | `docs/figma-make/src/App.tsx` | 3.12, 4.1, 4.7, 5 (översikt), 6.1, 6.2 |
| 2 | `docs/figma-make/src/main.tsx` | 4.1 (applikationsstart som monterar `App` och importerar `index.css`) |
| 3 | `docs/figma-make/src/vite-env.d.ts` | 11 (Vite TypeScript-referensfil `/// <reference types="vite/client" />`, ingen UI-logik) |
| 4 | `docs/figma-make/src/index.css` | 1, 2.1–2.5, 3.1, 3.2, 3.6, 3.10, 10.4 |
| 5 | `docs/figma-make/src/data.ts` | 2.1, 5.1–5.5, 6.1, 8.2, 10.1–10.3 |
| 6 | `docs/figma-make/src/hooks/useIsMobile.ts` | 2.6, 3.5, 4.3, 4.7 |
| 7 | `docs/figma-make/src/components/Nav.tsx` | 2.1–2.3, 2.5, 2.6, 3.1, 4.2, 7, 8.1, 10.3, 10.4 |
| 8 | `docs/figma-make/src/components/BottomNav.tsx` | 2.2, 2.3, 2.5, 2.6, 4.4, 8.1 |
| 9 | `docs/figma-make/src/components/MobileDrawer.tsx` | 2.1, 2.3, 2.5, 2.6, 3.1, 4.5, 6.3, 7, 8.1, 9, 10.4 |
| 10 | `docs/figma-make/src/components/CookieBanner.tsx` | 2.3–2.6, 3.12, 4.1, 8.1 |
| 11 | `docs/figma-make/src/components/HomeScreen.tsx` | 2.1–2.6, 3.1–3.4, 4.6, 5.1, 6.1, 7, 8.1, 9, 10.3, 10.4 |
| 12 | `docs/figma-make/src/components/FilmerScreen.tsx` | 2.1–2.6, 3.1–3.4, 3.6–3.8, 5.2, 6.1, 8.1, 9, 10.3 |
| 13 | `docs/figma-make/src/components/MovieDetailScreen.tsx` | 2.1–2.6, 3.1, 3.2, 5.3, 6.1, 8.1, 10.3, 10.4 |
| 14 | `docs/figma-make/src/components/SeatSelectionScreen.tsx` | 2.1–2.5, 3.1, 3.6, 3.10, 3.11, 5.4, 6.1, 7, 8.1, 10.1–10.3 |
| 15 | `docs/figma-make/src/components/BookingConfirmScreen.tsx` | 2.1–2.4, 3.1, 3.9, 5.5, 6.1, 6.2, 8.1, 10.3 |
| 16 | `docs/figma-make/src/components/SalongerScreen.tsx` | 2.1–2.3, 2.6, 3.10, 5.6, 8.1, 8.2, 10.1–10.3 |
| 17 | `docs/figma-make/src/components/MyBookingsScreen.tsx` | 2.2, 2.3, 2.6, 3.1, 3.4, 3.7, 3.8, 5.8, 6.2, 7, 8.1, 10.4 |
| 18 | `docs/figma-make/src/components/ProfilScreen.tsx` | 2.1–2.4, 2.6, 3.1, 3.4, 3.6, 3.8, 3.9, 5.9, 7, 8.1, 9, 10.4 |
| 19 | `docs/figma-make/src/components/AdminScreen.tsx` | 2.1–2.3, 2.5, 2.6, 3.8, 4.1, 4.3, 5.10–5.13, 6.3, 7, 8.1 |
| 20 | `docs/figma-make/src/components/admin/adminData.ts` | 5.10–5.13, 10.1, 10.2 |
| 21 | `docs/figma-make/src/components/admin/BokningarTab.tsx` | 2.1, 2.2, 2.4, 3.1, 3.3–3.6, 3.10, 5.10, 6.3, 8.1, 10.3, 10.4 |
| 22 | `docs/figma-make/src/components/admin/SchemaTab.tsx` | 2.1, 2.2, 2.4, 2.6, 3.1–3.3, 3.5–3.7, 5.11, 6.3, 8.1, 10.3, 10.4 |
| 23 | `docs/figma-make/src/components/admin/FilmarkivTab.tsx` | 2.1, 2.4, 2.6, 3.1, 3.3, 3.5–3.7, 3.9, 5.12, 6.3, 8.1, 8.2, 9, 10.3 |
| 24 | `docs/figma-make/src/components/admin/SalongerAdminTab.tsx` | 2.1, 2.2, 2.6, 3.1, 3.6, 3.7, 3.10, 3.11, 5.13, 6.3, 8.1, 10.2 |
| 25 | `docs/figma-make/src/imports/pasted_text/cinema-app-screens.md` | 1, 2.2, 2.6, 5.1, 5.3–5.5, 5.8, 8.2, 10.2, 10.3 |
| 26 | `docs/figma-make/src/imports/pasted_text/filmvisarna-booking-spec.md` | 1, 2.1, 2.3, 2.4, 2.6, 5.1, 5.3–5.5, 5.8, 8.2, 10.2, 10.3 |
| 27 | `docs/figma-make/src/assets/spec2.png` | 1, 8.2 (textkopia av `filmvisarna-booking-spec.md`) |
| 28 | `docs/figma-make/src/assets/upload.png` | 1, 8.2 (textkopia av `cinema-app-screens.md`) |

### Aktuell implementation: filmer, profiler och adminnavigering

| Källfiler i appen | Dokumentation |
| :--- | :--- |
| `Frontend/src/components/Navbar.tsx`, `MobileDrawer.tsx`, `BottomNav.tsx` och `styles/_navigation.scss` | [Layout §4.2–4.5](layout.md#42-toppnavigering-navbartsx--brandlogotsx): rollstyrd Backoffice-länk, desktopmeny, mobil sidomeny och bottennavigering. |
| `Frontend/src/components/admin/AdminPageHeader.tsx` och `styles/components/admin/_admin-screenings.scss` | [Komponenter §3.14](components.md#314-gemensamt-adminsidhuvud-adminpageheadertsx): delat sidhuvud och responsiv brödsmula till `/admin`. |
| `Frontend/src/pages/admin/AdminMovies.tsx`, `components/admin/MoviesTable.tsx` och `styles/components/admin/_admin-movies.scss` | [Filmarkiv](pages/admin-filmer.md): sökning, 10 filmer per sida, tabell/kort, genrer, visningsantal och skyddad borttagning. |
| `Frontend/src/components/admin/MovieFormModal.tsx`, `CastMemberEditor.tsx`, `api/movies.ts`, `api/persons.ts`, `utils/movieForm.ts` och `utils/imageValidation.ts` | [Filmarkivets formulär](pages/admin-filmer.md#filmformulär-och-tmdb-import): TMDB-import, filuppladdning, profilredigering och sparningsåterkoppling. |
| `Frontend/src/pages/admin/AdminScreenings.tsx`, `components/admin/ScreeningsTable.tsx` och `ScreeningFormModal.tsx` | [Visningsschema](pages/admin-visningar.md): filter, 15 visningar per sida, kort under 1200px, två kortkolumner på surfplatta och responsivt formulär. |
| `Frontend/src/pages/MovieDetails.tsx`, `components/Modal.tsx` och `styles/components/_movie-details.scss` | [Skådespelarprofiler](pages/movie-detail.md#klickbara-skådespelarprofiler): profilbilder, reservikon, rollfigur och biografimodal. |
| `Backend/src/services/movies.service.ts`, `persons.service.ts`, `tmdb.service.ts`, `routes/upload.ts` och cast-migrationen | [Backend/README.md](../Backend/README.md#cast-profiles-and-image-uploads): API, personregister, transaktioner, validering och seed-berikning som de aktuella vyerna använder. |
