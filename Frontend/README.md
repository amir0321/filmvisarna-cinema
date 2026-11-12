# Filmvisarna Cinema - Frontend

React 19 + TypeScript + Vite + Bootstrap 5 + Sass application for the Filmvisarna cinema project.

## Scripts

- `npm run dev`: Start Vite development server
- `npm run build`: Type-check and build for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint

For full project documentation, see the root [README.md](../README.md).

## Admin movie components

`MoviesTable` takes `movies: Movie[]`, `onEdit(movie)` and `onDelete(movie): Promise<void>`. The parent performs deletion through `api/movies` and refreshes its movie list; reject on failure so the table can display the error. The component shows a table from 768 px and cards below that width. Any positive `total_screenings_count` or `active_screenings_count` blocks deletion with a visible Swedish explanation. If counts are unavailable, a backend 409 still produces the explanation.

`CastMemberEditor` is a controlled film-form field:

```tsx
const [castMembers, setCastMembers] = useState<MovieCastInput[]>([])

<CastMemberEditor value={castMembers} onChange={setCastMembers} disabled={isSavingMovie} />
```

Initialize `value` from the movie's full `cast_members` when editing. Search is debounced and aborts obsolete requests. Registered people are reused, and duplicate IDs, TMDB IDs and normalized names are blocked in the film's cast. New profiles and profile edits are saved explicitly through the person API; photo files are previewed locally and uploaded only when the profile is saved. Profile edits apply across movies. Missing optional profile data is preserved until the corresponding field is edited.

The parent includes the resulting array as `cast_members` when saving the movie. Removing someone only updates this array and never deletes a person profile. The editor uses buttons rather than a nested form so it can be embedded inside the movie form. Its optional `onDraftChange(open)` callback lets the movie form block movie saves/imports until a profile draft is saved or cancelled.

## Admin movie archive and form

The archive and screening schedule share `AdminPageHeader`: `Backoffice` links to `/admin`, followed by the current page. Breadcrumbs sit at the top right from 768 px and below the title on mobile. `Backoffice` is also the first admin desktop navigation link and the overview link in the mobile drawer; its active state matches `/admin` exactly. Admin entry links on public pages use the same label.

Current design documentation: [navigation and breadcrumbs](../design/layout.md), [movie archive](../design/pages/admin-filmer.md), [screening schedule](../design/pages/admin-visningar.md) and [actor profiles on movie details](../design/pages/movie-detail.md).

`/admin/filmer` (alias `/admin/movies`) now uses `AdminMovies`, `MoviesTable` and `MovieFormModal`. The page filters by film title or director, displays the matching film count and paginates ten films per page. Existing admin route protection and `apiClient` cookie/CSRF handling apply to all writes. On closing a form, the archive reloads so shared person-profile edits are reflected too.

The form supports complete manual creation/editing and optional TMDB import. Search waits 350 ms and aborts obsolete requests; suggestions show poster, title and year. Selecting a suggestion fetches the full preview, including actor profiles/characters/TMDB IDs, and replaces the form fields for review. Missing runtime must be completed. TMDB failures leave manual entry available. The form is loaded on demand when opened.

Poster files are previewed locally and uploaded on save. JPEG, PNG, WebP and GIF are accepted up to 5 MB; the backend additionally verifies matching extension/MIME/magic bytes and removes invalid content. Safe HTTP(S) or `/uploads/` image URLs can be entered instead. Movie-field and cast data are sent together to the transactional movie endpoint. Success shows a green **Sparad!** in the modal and the archive; the modal remains open, and further changes update the same movie ID rather than creating another movie.

Verification for this implementation: backend build and all 66 backend tests passed with isolated PostgreSQL and simulated TMDB; frontend lint/build and all 42 frontend tests passed. New form tests cover external metadata/profile retention, legacy actor preservation, required fields, date/number limits and unsafe URLs. Browser checks used a temporary API fixture to exercise director search, ten-row pagination, TMDB preview/import, repeat save (one POST, then PUT), manual save during TMDB 503, local poster preview, upload error feedback and a 390 px mobile modal with fixed footer. No live TMDB request or production database write was used for these checks.
