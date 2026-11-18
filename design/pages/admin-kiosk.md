> Bygger på: [design/tokens.md](../tokens.md), [design/components.md](../components.md), [design/layout.md](../layout.md) (4.3 Admin-toppnavigering) och [design/flows.md](../flows.md) (se 10.4 OKLART). Index: [DESIGN.md](../../DESIGN.md).

### 5.14 Admin – Kiosk

- **Föreslagen route:** `/admin/kiosk` (Föreslagen)
- **Status:** **Saknas i prototypen** (`docs/figma-make/src/` innehåller ingen kiosk-flik i `AdminScreen.tsx`), men backend-endpoints finns (`/api/admin/menu-items`, `POST /api/admin/menu-items`, `PATCH /api/admin/menu-items/:id`).

#### Bindande krav vid eventuell implementation av `/admin/kiosk`

Om `/admin/kiosk` byggs ut i frontend ska den följa samma arkitektur- och designkrav som övriga adminmoduler (`AdminMovies`, `AdminScreenings`):
1. **Gemensamt skal och sidhuvud:** Använd `AdminLayout` och `AdminPageHeader` med brödsmula (`Backoffice › Kiosk` på svenska / `Backoffice › Concessions` på engelska). Responsiv tabell på desktop (`>= 768px`), staplade kort på mobil (`< 768px`), och gemensam `Modal` (BottomSheet på `< 768px`) för att skapa/redigera kioskvaror och menyer.
2. **Mörkt och ljust tema (`dark` / `light`, FE-36):** Använd uteslutande semantiska CSS-/Sass-tokens (`$fv-card-bg`, `$fv-muted-bg`, `$fv-fg`, `$fv-muted-fg`, `$fv-border`, `$fv-primary`, `$fv-success`, `tint(...)`, `$white-overlay-*`) från [design/tokens.md](../tokens.md). Inga hårdkodade hex-färger eller inline-stilar; säkerställ WCAG AA-kontrast (`>= 4,5:1`) i både mörkt och ljust tema.
3. **Svensk och engelsk översättning (`sv` / `en`):** Alla rubriker, kategorier (`Snacks`, `Dryck`, `Menyer` / `Snacks`, `Drinks`, `Combos`), tabellkolumner, formulärfält, statusmärkningar (`Tillgänglig` / `Available`, `Slut i lager` / `Unavailable`), knappar, tom-/laddnings-/feltillstånd och `aria-label`-attribut ska stödja både svenska (`sv`) och engelska (`en`) via det gemensamma översättningssystemet.

