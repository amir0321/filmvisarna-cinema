---
trigger: always_on
---

# Filmvisarna – Frontend rules

## 1. Context
- Cinema booking app. Frontend lives in `Frontend/`: React 19, TypeScript, Vite, Bootstrap 5 + Sass, React Router.
- The backend (Express 5) lives in `Backend/`. Never edit it unless I ask.
- UI text is Swedish. Code, comments and commit messages are English.
- Work is tracked as board cards (FE-1 … FE-33). Implement one card at a time; scope = the card description.
- Booking, guest and future admin work must follow `design/booking-security.md`. Guest requests and confirmed bookings are separate concepts; do not build future admin abuse-management UI unless explicitly requested.

## 2. Structure (`Frontend/src/`)
- `api/` API client and request functions
- `types/` shared types (api, booking, movie, screening, seat, user)
- `hooks/` data hooks
- `components/` reusable UI
- `layouts/` page shells (public, admin)
- `pages/` file-based routes, `pages/admin/` for backoffice
- `routes.tsx` builds routes from `pages/**` with `import.meta.glob`. Read it before adding or renaming a page.
- Pages may export `navTitle`, `navOrder`, `hideFromNav`. Filenames containing `detail` receive an `:id` param.
- Look at the existing files in a folder before creating new ones.

## 3. Code conventions
- Function components, strict TypeScript, no `any`. Use the types in `src/types`.
- Server calls only through `src/api` and hooks. Never call `fetch` directly in a component.
- Styling: Bootstrap 5 utilities + SCSS variables (`$fv-*` tokens from `design/tokens.md`). No inline styles, no hard-coded hex values in components, no new CSS libraries.
- Every screen handles loading (skeleton/spinner), error (with retry) and empty state.
- Dates and times go through one shared util (locale `sv-SE`, timezone `Europe/Stockholm`). Prices are shown as `"140 kr"`.
- This is a Vite + React SPA, not Next.js. Ignore skill advice about Server Components, Next.js routing, SSR or `next/*` imports.
- Stay on the current feature branch.

## 4. UI and design (`DESIGN.md` & `design/`)
`DESIGN.md` and the split files in `design/` are the **single source of truth** for UI and design. Do **not** read, reference or copy code from `docs/figma-make/`.
- Read `DESIGN.md` first (index + design principles), then read **only** the files under `design/` that the current card needs (`design/tokens.md`, `design/components.md`, `design/layout.md`, `design/flows.md`, and the matching file in `design/pages/`). Never read all of `design/` at once.
- If a skill suggests a different visual direction than the design files, follow the design files.
- Where `design/flows.md` (§9–10) notes prototype inconsistencies or missing states, follow the Backend API contract (§5) and these rules.

### Visual tokens (`design/tokens.md`)
- **Dark theme only:** Page background `#0B0F19` (`$fv-bg`), elevated cards/modals/tables/bottom-nav `#161F30` (`$fv-card-bg`), secondary dark blue `#1E2D47` (`$fv-secondary`), muted surface `#111827` (`$fv-muted-bg`), mobile drawer `#0F1729` (`$fv-drawer-bg`), primary text `#F8FAFC` (`$fv-fg`), muted text `#94A3B8` (`$fv-muted-fg`), subtle border `1px solid rgba(148, 163, 184, 0.15)` (`$fv-border`).
- **Glassmorphism:** Top navbars, sticky filter bars, image overlays and glass buttons use semi-transparent backgrounds with `backdrop-filter: blur(...)` (`$fv-glass-bg`, `$fv-nav-bg`, `$fv-blur-glass`). Hero and auditorium backdrops fade into `$fv-bg` via linear gradients.
- **Semantic colors:**
  - **Cinema Red (`#E50914`, `$fv-primary`):** Primary CTAs, active chips/tabs, focus rings (`2px solid #E50914`), 15+ age badge, Salong 1 identity. Light danger (`#ff6b6b`, `$fv-danger-light`) for low-seat warnings, cancel/destructive outline buttons, cancelled screenings, and Salong 1 admin badge.
  - **Emerald Green (`#10B981`, `$fv-success`):** Selected seats (with green glow `$fv-glow-seat`), completed stepper steps, booking confirmation, `"Alla"` age badge, `"Betald"` status, and Salong 2 accent on the Salonger page.
  - **Amber / Warning (`#F59E0B` / `#D97706`, `$fv-warning` / `$fv-warning-dark`):** IMDb star & rating, premiere banner gradient, 7/11 age badges, `"Inväntar"` payment status, and high occupancy (> 80%).
  - **Info Blue (`#3B82F6` / `#60A5FA`, `$fv-info` / `$fv-info-light`):** Wheelchair seats, `"Tillgänglig"` badge, Salong 2 badge in admin schedule, and `"Dagens bokningar"` KPI.
- **Typography:**
  - `Poppins` (`$fv-font-display`): Headings (`h1`–`h3`), `FILMVISARNA` logo, movie titles, price totals, and KPI numbers.
  - `Inter` (`$fv-font-sans`): Body text, buttons, form controls, labels, chips, and tables.
  - `JetBrains Mono` (`$fv-font-mono`): Booking references (`FV-XXXXX`), admin screening times, seat row letters (`A`–`J`), and numeric ratings.
- **Spacing, radii & motion:**
  - 8px spacing scale (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`).
  - Border radius: `16px` cards/modals/tables (`$fv-card-radius`), `10px`–`12px` buttons/inputs, `6px 6px 3px 3px` seats (`$fv-radius-seat`), `20px`/`9999px` chips & pills (`$fv-radius-pill`), `20px 20px 0 0` mobile `BottomSheet`.
  - Hover & micro-interactions: Movie cards lift (`translateY(-4px)`) with shadow (`$fv-shadow-card-lg` / `$fv-shadow-card-md`) and 2:3 poster zoom (`scale(1.05)`). Available/selected seats scale on hover (`scale(1.15)`).

### Components, layout & accessibility (`design/components.md`, `design/layout.md`)
- **Buttons:** Primary (`#E50914` filled), Secondary (dark outline or `.glass`), Destructive (`#ff6b6b` outline; in admin tables/cards, clicking `"Ställ in"` / `"Ta bort"` swaps inline to `"Bekräfta"` + `"Avbryt"`), Green action (`"Markera betald"` -> `"✓ Betald"` badge), Tertiary (text link).
- **Inline feedback:** Use inline button/label state feedback (`"Kopierat"`, `"Sparat!"`, `"Sparad!"`) as specified in `design/components.md` §3.9 instead of floating toast libraries.
- **Pagination (`design/components.md` §3.13):** Reuse `usePagination` and `Pagination` after filtering/sorting. Page sizes: home repertoire 8 movies (2 × 4 on wide desktop), `/filmer` 10 movies (2 × 5), `/mina-bokningar` 5 cards per tab with independent page state, and `/admin/*` tables/mobile lists 10 rows/cards when integrated. Hide pagination for at most one page; clamp the page when lists shrink. Reset the home repertoire to page 1 on date or age filter changes; reset `/filmer` to page 1 on tab, search, filter or sort changes. Use the dark `$fv-*` tokens, 40×40px minimum buttons, native disabled states, `aria-current="page"` and a red focus ring. At `< 640px`, show previous/next with `Sida {page} av {totalPages}`; at `>= 640px`, show page buttons with ellipses above 7 pages.
- **Persistent filters:** Home stores presets in `when=today|tomorrow|weekend` (today is omitted), calendar selections in `date=YYYY-MM-DD`, and age in `age=0|7|11|15`. `/filmer` persists its selected date and age too. Parse and validate URL values, preserve unrelated parameters, and support reload/back/forward. Do not use local storage for these filters.
- **Movie images:** Reuse `Poster` with an optional alternate source. Try the landscape image if a poster fails, then render the existing title fallback. Hero backdrops try poster artwork if the landscape image fails.
- **Chips & badges:** Standard filter chips (`.chip-active` `#E50914`, `.chip-inactive` `#161F30`), genre chips, age chips, and screening time pills on movie cards. Keep the low-seat warning threshold in one shared constant.
- **Hero carousel & trailer flow (`design/pages/home.md` §5.1, `design/pages/movie-detail.md` §5.3):**
  - **Home hero (`HeroSection`):** Displays up to 5 featured movies (`HERO_MOVIE_COUNT = 5`), rotating every 15 seconds with prev/next arrows (`.hero-carousel__arrow`), pagination dots (`.hero-carousel__dot`), and a pause/play toggle (`.hero-carousel__pause`). Plays the active movie's YouTube trailer muted and looping in the background (`getYouTubeBackgroundUrl`), with `start=12`, `disablekb=1`, `iv_load_policy=3` and `fs=0`. Use `enablejsapi=1` plus the page origin and the official YouTube IFrame API. Reveal only after both the playback position and the clock advance for three continuous seconds in PLAYING state; iframe load alone must never reveal the player. Hide immediately without a fade-out on pause, buffering, seek/loop, playback errors or autoplay blocking, keeping the backdrop visible. Fade in over 0.8s with cropped `scale(1.2)` once warmed up again. Destroy the player and clear the progress interval on slide changes, pause and unmount; keep iframe DOM ownership inside the video's container to support Strict Mode. Omit deprecated `modestbranding`. Pauses rotation on hover, `:focus-visible`, or when `prefers-reduced-motion: reduce` is enabled.
  - **Navbar search:** The shared search button (`aria-label="Sök filmer"`) navigates to `/filmer?sok=1`. Focus the movie search input with `preventScroll`, then scroll it into view smoothly (instantly for reduced motion). Remove only `sok` using URL replacement, preserving other query parameters. Also handle repeated clicks while already on `/filmer`.
  - **Trailer navigation:** Clicking `"Se Trailer"` in the home hero navigates to `/filmer/:id?trailer=1` (`getMovieTrailerUrl`), which opens `TrailerModal` on the movie detail page (`MovieDetails`). On `MovieDetails`, both `?trailer=1` and the circular play button in the backdrop hero open `TrailerModal`.
- **Auditoriums and seed data:** The cinema has exactly two auditoriums: Stora Salongen (8 rows A–H × 10 seats = 80) and Lilla Salongen (5 rows A–E × 8 seats = 40). Seed data must use these same two rooms; never add test cinemas to force pagination. Spread screenings across days, preserve the 20-minute cleaning buffer, and hide pagination when a date-filtered result fits on one page.
- **Sold-out booking:** Use the seat endpoint's actual availability. With zero free seats, replace ticket selectors, seat selection, kiosk and checkout with `Visningen är fullbokad`, its explanation and `Se andra visningstider`. Otherwise enforce one shared `min(10, availableSeats)` ticket limit across categories, including URL presets and availability polling. Guard submission against unavailable seats.
- **Seat maps (`design/components.md` §3.10):**
  - **Public booking map:** Curved `BIODUK` arc with projection glow, row letters (`A`, `B`, …) on both left and right in `JetBrains Mono`, horizontally scrollable container (`overflow-x: auto`). Seat states: `Ledig` (`#334155`), `Vald` (`#10B981` with green glow), `Upptagen` (`#1E293B`, `opacity: 0.4`, diagonal slash), and `Rullstol` (`♿`, `#3B82F6` / `$fv-info` rullstolsanpassad plats), with legend.
  - **Other variants:** Non-interactive mini map on `Salonger` (shows `Ledig`, `Exempelval`, `Rullstol`), admin live map in `Bokningar & Kassa` (`Ledig`, `Bokad`, `Inväntar`), and admin preview grid in `Salonger` admin.
- **Shells & responsive behavior (`design/layout.md`):**
  - Breakpoints: `sm` (`640px`), `md` (`768px`, mobile/desktop split), `lg` (`1024px`), `xl` (`1280px`).
  - **Public & Admin shells share the same header and navigation design:** Sticky top `Navbar` (`64px`, `.app-navbar`, `.nav-container` max-width `1280px`, `.public-nav-link`, search button + avatar dropdown on desktop), `MobileDrawer` (slides in from right on `< 768px`), fixed `BottomNav` (`64px` on `< 768px` with `padding-bottom: 64px` on `main`), and `Footer`. The shared responsive footer includes contact details, opening hours, the pay-at-counter notice, privacy/storage information modals and an admin link visible only to administrators.
  - **Admin shell (`/admin/*`):** Uses the exact same `Navbar`, `MobileDrawer`, and `BottomNav` design as the public website, displaying the admin navigation links (`Bokningar`, `Schema`, `Filmer`, `Salonger`, plus `Till biografen`). On `< 768px`, desktop data tables switch to stacked mobile cards, and schedule/movie modals render as a slide-up `BottomSheet`.
- **Accessibility & copy:**
  - WCAG AA contrast, visible focus ring (`outline: 2px solid #E50914`, `outline-offset: 2px`), labels on all inputs, `aria-label` on icon buttons, `alt` text on images, keyboard-operable seat map, drawers and modals.
  - Use exact Swedish copy from `DESIGN.md` and `design/pages/*.md`. No placeholder English text.
  - Reuse existing components before creating new ones.

## 5. Backend API contract
Source: `Backend/README.md`, `Backend/src/` and the Postman collection. Never assume endpoints or fields that are not there.
If something is missing, say so and propose a UI fallback instead of inventing it.

- Base path `/api` (Vite proxies to :3000). Auth header: `Authorization: Bearer <JWT>`. Token lasts 7 days.
- On 401: clear the session and send the user to login.
- Error shape: `{ success: false, error: string, details?: string[] }`. Show `error`; map `details` to form fields.
- Statuses: 400 validation, 401 not logged in, 403 not admin, 404 not found, 409 conflict.
- Password 8–72 characters. 409 on register means the email already exists.
- A booking has 1–10 tickets, no duplicate seats. Members must have server-verified email. Guests use `/bookings/guest/request`, `/guest/preview` and `/guest/confirm`; direct guest `POST /bookings` is forbidden. Requests reserve no seats and must be explicitly confirmed through a short-lived email link.
- Booking creation and guest-request submission use a stable `Idempotency-Key` UUID per unchanged payload. Disable duplicate submissions, retain the key on retries and use server-created receipt data. Handle 403 verification requirements, 409 seat/quota/idempotency conflicts, 429 rate limits and 503 mail outages without claiming success.
- Shared guest/member quotas and independent IP/global limits are enforced in the API. Never rely on browser state, local storage, hidden controls or a client-supplied role/email to enforce them. Keep guest tokens in component memory, remove URL fragments and never log token values.
- Future admin features must keep guest requests out of confirmed-booking lists, occupancy and revenue. Abuse flagging, staff cancellation/releasing seats and protected audit logs are required when that later admin work is authorized; they are not implemented by the current public-booking change.
- Seat map returns only `available` / `booked`. Cinema rows and seats per row come dynamically from the backend.
- `GET /screenings`: `when` and `date` cannot be sent together. Age filter uses `age`. Genre and text search are filtered client-side.
- Cancellation is not allowed less than 2 hours before start. The backend decides; the UI only shows a hint.
- Guests cannot look up a booking (`lookup` is admin only). The confirmation page uses the `POST /bookings` response (`bookingRef`, `totalPrice`).
- Email cancel link: `GET /bookings/cancel-preview?token=` and `POST /bookings/cancel-by-token`. Show the backend error message for invalid, used or too-late links.
- Create cinema: rows 1–26, seats per row 1–50. Afterwards only the name can be changed.
- Deleting a movie, cinema or screening that has dependents returns 409. Show the reason.
- Screening start in the past = 400. Overlap incl. 20 min cleaning buffer = 409. Changing time/cinema with existing bookings = 409.
- Poster upload is a file upload: `POST /api/upload` with multipart form field `image` (admin only).

## 6. Not in scope & prototype overrides (`design/flows.md` §9–10)
- No role switcher (`"Byt roll"`), no unauthenticated demo links to Admin in public footer/drawer for non-admins, and no contact form on `Om oss`.
- Do not build interactive UI that pretends an endpoint exists when it does not (e.g. loyalty points `"Poäng: 240"` or `"Bli påmind vid biljettsläpp"`). Show read-only data, omit the mock-only widget, or show a `"Kommer snart"` state instead. (Note: profile update, admin booking list, and kiosk admin **are** implemented in the backend API).
- Always enforce backend rules over prototype mock values: max 10 tickets per booking (not 8 per type), 20 min cleaning buffer (not 15 min), cinema rows 1–26 & seats 1–50 on creation (only name editable afterwards), and poster upload via `POST /api/upload`.

## 7. Seed and verification
- `npm run seed:demo` in `Backend/` adds/updates demo data transactionally and retains existing bookings and passwords. The legacy-test-room migration preserves booking references and seat labels while moving showings into Stora Salongen. It removes obsolete test rooms and rebuilds only unbooked seed showings. `npm run seed` is a full reset.
- Demo catalogue: 12 current films and 4 upcoming retrospective premieres, 14-day programme, Dune with only D4/D5/H9 free, an Interstellar sold-out screening, and at least 6 upcoming plus 6 historical bookings per demo account. Actual scenario dates/times and links are printed by the seeder.
- Verify with `npm run seed:check -- --api` and `npm run seed:images`. Future screenings and ticket/cinema mappings must be valid, with exactly two cinemas and no scheduling overlaps. Image verification does not prove YouTube autoplay behavior.

## 8. Test scope
- Keep only tests protecting important authentication/security paths, booking status, cancellation boundaries, actual seat availability and the reported trailer-overlay regression. Avoid tests that merely repeat schema declarations, constants or fake implementations defined inside the test. Use the explicit seed verification commands for demo data and public image checks.

## 9. Before reporting done
- Run lint and build from `Frontend/` (check `package.json` for the exact script names) and report the result.
