import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { createMovie, fetchExternalMovieDetails, searchExternalMovies, updateMovie, uploadImage } from '../../api/movies'
import type { ExternalMovieSuggestion, Movie } from '../../types/movie'
import { isSafeImageUrl, validateImageFile } from '../../utils/imageValidation'
import { initialMovieValues, moviePayload, validateMovieValues, type MovieFormValues } from '../../utils/movieForm'
import { Modal } from '../Modal'
import { Poster } from '../Poster'
import { InlineFeedback } from '../Toast'
import CastMemberEditor from './CastMemberEditor'

export interface MovieFormModalProps {
  movie: Movie | null
  onClose: () => void
  onSaved: (movie: Movie) => void
}

interface SearchState { query: string; results: ExternalMovieSuggestion[]; loading: boolean; error: string | null }

function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  return error.message === 'Valideringsfel'
    ? 'Kontrollera filmens uppgifter, bildlänkar och rollista och försök igen.' : error.message
}

export default function MovieFormModal({ movie, onClose, onSaved }: MovieFormModalProps) {
  const id = useId()
  const [values, setValues] = useState(() => initialMovieValues(movie))
  const [movieId, setMovieId] = useState(movie?.id ?? null)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<SearchState>({ query: '', results: [], loading: false, error: null })
  const [retry, setRetry] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [castDraftOpen, setCastDraftOpen] = useState(false)
  const [castVersion, setCastVersion] = useState(0)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [posterError, setPosterError] = useState<string | null>(null)
  const posterPreviewRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<AbortController | null>(null)
  const saveRef = useRef<AbortController | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const searchQuery = query.trim()
  const canSearch = !saving && !importing && !castDraftOpen && searchQuery.length >= 2
  const currentSearch = search.query === searchQuery ? search : null
  const searchLoading = canSearch && (!currentSearch || currentSearch.loading)
  const locked = saving || importing
  const posterSrc = posterPreview || (isSafeImageUrl(values.poster_url) ? values.poster_url.trim() : null)

  useEffect(() => {
    if (!canSearch) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSearch({ query: searchQuery, results: [], loading: true, error: null })
      void searchExternalMovies(searchQuery, controller.signal).then(results => {
        if (!controller.signal.aborted) setSearch({ query: searchQuery, results, loading: false, error: null })
      }).catch(err => {
        if (!controller.signal.aborted) setSearch({ query: searchQuery, results: [], loading: false,
          error: errorMessage(err, 'Det gick inte att söka efter filmer. Försök igen eller fyll i filmen manuellt.') })
      })
    }, 350)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [searchQuery, canSearch, retry])

  useEffect(() => () => {
    importRef.current?.abort()
    saveRef.current?.abort()
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current)
  }, [])

  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  function change<K extends keyof MovieFormValues>(field: K, value: MovieFormValues[K]) {
    setValues(current => ({ ...current, [field]: value }))
    setSaved(false)
    setError(null)
  }

  function releasePosterPreview() {
    if (posterPreviewRef.current) URL.revokeObjectURL(posterPreviewRef.current)
    posterPreviewRef.current = null
    setPosterPreview(null)
    setPosterFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function selectPoster(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    const validation = validateImageFile(file)
    releasePosterPreview()
    setPosterError(validation ?? null)
    setSaved(false)
    if (validation) return
    const url = URL.createObjectURL(file)
    posterPreviewRef.current = url
    setPosterPreview(url)
    setPosterFile(file)
    change('poster_url', '')
  }

  async function importMovie(tmdbId: number) {
    if (saving || castDraftOpen) return
    importRef.current?.abort()
    const controller = new AbortController()
    importRef.current = controller
    setImporting(true)
    setQuery('')
    setError(null)
    setImportNotice(null)
    try {
      const details = await fetchExternalMovieDetails(tmdbId, controller.signal)
      if (controller.signal.aborted) return
      releasePosterPreview()
      setPosterError(null)
      setValues(initialMovieValues(details))
      setCastVersion(version => version + 1)
      setSaved(false)
      setImportNotice(`Hämtat: ${details.title}${details.originalTitle && details.originalTitle !== details.title ? ` (${details.originalTitle})` : ''}. Granska och ändra uppgifterna innan du sparar.${details.duration_minutes ? '' : ' Speltid saknas och behöver fyllas i.'}`)
    } catch (err) {
      if (!controller.signal.aborted) setError(errorMessage(err, 'Det gick inte att hämta filmens uppgifter. Fyll i filmen manuellt eller försök igen.'))
    } finally {
      if (importRef.current === controller) importRef.current = null
      if (!controller.signal.aborted) setImporting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveRef.current || locked || saved) return
    if (castDraftOpen) { setError('Spara eller avbryt skådespelarens redigering innan du sparar filmen.'); return }
    const validation = posterError || validateMovieValues(values)
    if (validation) { setError(validation); return }
    const controller = new AbortController()
    saveRef.current = controller
    setSaving(true)
    setError(null)
    try {
      const payload = moviePayload(values)
      if (posterFile) {
        payload.poster_url = await uploadImage(posterFile, controller.signal)
        if (controller.signal.aborted) return
        setValues(current => ({ ...current, poster_url: payload.poster_url ?? '' }))
        releasePosterPreview()
      }
      const result = movieId === null ? await createMovie(payload, controller.signal) : await updateMovie(movieId, payload, controller.signal)
      if (controller.signal.aborted) return
      setMovieId(result.id)
      setValues(initialMovieValues(result))
      setCastVersion(version => version + 1)
      setSaved(true)
      onSaved(result)
    } catch (err) {
      if (!controller.signal.aborted) setError(errorMessage(err, 'Det gick inte att spara filmen. Kontrollera anslutningen och försök igen.'))
    } finally {
      saveRef.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={() => { if (!saving) onClose() }} title={movieId === null ? 'Lägg till film' : 'Redigera film'} size="lg">
      <form className="movie-form" onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {error ? <div ref={errorRef} tabIndex={-1}><InlineFeedback variant="danger" message={error} className="mb-3" /></div> : null}
          {saved ? <InlineFeedback variant="success" message="Sparad!" className="mb-3" /> : null}
          <fieldset className="movie-form__import" disabled={locked || castDraftOpen}>
            <legend>Hämta filmuppgifter automatiskt</legend>
            <label htmlFor={`${id}-tmdb`} className="form-label">Sök efter en film på TMDB</label>
            <input id={`${id}-tmdb`} type="search" className="form-control" value={query} maxLength={120} placeholder="Skriv minst två tecken, till exempel Dune"
              onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault() }} aria-describedby={`${id}-search-status`} />
            <p className="movie-form__hint">Val av en film ersätter formulärets uppgifter. Du kan också fylla i allt manuellt.</p>
            <p id={`${id}-search-status`} className="movie-form__hint" role="status">
              {searchLoading ? 'Söker efter filmer…' : canSearch && currentSearch && !currentSearch.error && currentSearch.results.length === 0 ? 'Inga filmer hittades. Prova en annan titel eller fyll i filmen manuellt.' : null}
            </p>
            {canSearch && currentSearch?.error ? <><InlineFeedback variant="danger" message={currentSearch.error} /><button type="button" className="btn btn-sm btn-outline-light mt-2" onClick={() => setRetry(count => count + 1)}>Försök igen</button></> : null}
            {canSearch && currentSearch && !currentSearch.loading && currentSearch.results.length > 0 ? (
              <ul className="movie-form__suggestions" aria-label="Filmförslag från TMDB">
                {currentSearch.results.map(suggestion => <li key={suggestion.tmdbId}><button type="button" onClick={() => void importMovie(suggestion.tmdbId)}>
                  <Poster src={isSafeImageUrl(suggestion.posterUrl) ? suggestion.posterUrl : null} alt="" title={suggestion.title} size="sm" />
                  <span><strong>{suggestion.title}</strong><small>{suggestion.releaseYear ?? 'Årtal saknas'}{suggestion.originalTitle !== suggestion.title ? ` · ${suggestion.originalTitle}` : ''}</small></span>
                  <i className="bi bi-download" aria-hidden="true" />
                </button></li>)}
              </ul>
            ) : null}
          </fieldset>
          {importing ? <p role="status" className="movie-form__hint"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Hämtar filmuppgifter och rollista…</p> : null}
          {importNotice ? <InlineFeedback variant="info" message={importNotice} className="mb-3" /> : null}

          <fieldset className="movie-form__fields" disabled={locked}>
            <legend className="visually-hidden">Filmens uppgifter</legend>
            <div className="movie-form__grid">
              <div className="movie-form__wide"><label htmlFor={`${id}-title`} className="form-label">Filmtitel *</label><input id={`${id}-title`} className="form-control" value={values.title} maxLength={300} required onChange={event => change('title', event.target.value)} /></div>
              <div className="movie-form__wide"><label htmlFor={`${id}-description`} className="form-label">Beskrivning</label><textarea id={`${id}-description`} className="form-control" value={values.description} maxLength={2000} rows={4} onChange={event => change('description', event.target.value)} /></div>
              <div><label htmlFor={`${id}-duration`} className="form-label">Speltid (minuter) *</label><input id={`${id}-duration`} type="number" min={1} step={1} className="form-control" value={values.duration_minutes} required onChange={event => change('duration_minutes', event.target.value)} /></div>
              <div><label htmlFor={`${id}-age`} className="form-label">Åldersgräns</label><input id={`${id}-age`} className="form-control" list={`${id}-ages`} value={values.age_rating} maxLength={10} placeholder="Till exempel Alla, 7, 11 eller 15" onChange={event => change('age_rating', event.target.value)} /><datalist id={`${id}-ages`}>{['Alla', '7', '11', '15'].map(age => <option key={age} value={age} />)}</datalist></div>
              <div><label htmlFor={`${id}-director`} className="form-label">Regissör</label><input id={`${id}-director`} className="form-control" value={values.director} maxLength={200} onChange={event => change('director', event.target.value)} /></div>
              <div><label htmlFor={`${id}-rating`} className="form-label">Betyg (0–10)</label><input id={`${id}-rating`} type="number" min={0} max={10} step="0.1" className="form-control" value={values.imdb_rating} onChange={event => change('imdb_rating', event.target.value)} /><small className="movie-form__hint">Vid import används TMDB:s publikbetyg.</small></div>
              <div><label htmlFor={`${id}-date`} className="form-label">Premiärdatum</label><input id={`${id}-date`} type="date" className="form-control" value={values.release_date} onChange={event => change('release_date', event.target.value)} /></div>
              <div><label htmlFor={`${id}-genres`} className="form-label">Genrer</label><input id={`${id}-genres`} className="form-control" value={values.genres} onChange={event => change('genres', event.target.value)} /><small className="movie-form__hint">Separera med kommatecken. Högst 10 genrer.</small></div>
            </div>

            <div className="movie-form__artwork">
              <div className="movie-form__poster-preview"><Poster src={posterSrc} alt="Förhandsvisning av filmens affisch" title={values.title || 'Affisch'} size="md" /><span>Förhandsvisning</span></div>
              <div className="movie-form__poster-fields">
                <label htmlFor={`${id}-poster-file`} className="form-label">Ladda upp affisch</label>
                <input ref={fileInputRef} id={`${id}-poster-file`} type="file" className="form-control" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" onChange={selectPoster} aria-invalid={posterError !== null} aria-describedby={`${id}-poster-help`} />
                <p id={`${id}-poster-help`} className="movie-form__hint">JPG, PNG, WebP eller GIF. Högst 5 MB.{posterFile ? ` Vald fil: ${posterFile.name}.` : ''}</p>
                {posterError ? <InlineFeedback variant="danger" message={posterError} /> : null}
                <label htmlFor={`${id}-poster-url`} className="form-label">Eller ange affischens bild-URL</label>
                <input id={`${id}-poster-url`} className="form-control" inputMode="url" maxLength={2048} value={values.poster_url} onChange={event => { releasePosterPreview(); setPosterError(null); change('poster_url', event.target.value) }} />
                <button type="button" className="btn btn-sm btn-outline-light mt-2" onClick={() => { releasePosterPreview(); setPosterError(null); change('poster_url', '') }}>Ta bort affisch</button>
              </div>
            </div>
            <div className="movie-form__grid">
              <div className="movie-form__wide"><label htmlFor={`${id}-landscape`} className="form-label">Bild-URL för bred bild</label><input id={`${id}-landscape`} className="form-control" inputMode="url" maxLength={2048} value={values.landscape_image_url} onChange={event => change('landscape_image_url', event.target.value)} /><small className="movie-form__hint">Bildlänkar ska börja med http://, https:// eller /uploads/.</small></div>
              <div className="movie-form__wide"><label htmlFor={`${id}-trailer`} className="form-label">Trailer-URL</label><input id={`${id}-trailer`} className="form-control" inputMode="url" maxLength={2048} value={values.trailer_url} onChange={event => change('trailer_url', event.target.value)} /></div>
            </div>
          </fieldset>

          <CastMemberEditor key={castVersion} value={values.cast_members} onChange={members => change('cast_members', members)} disabled={locked}
            onDraftChange={open => { setCastDraftOpen(open); if (open) setSaved(false) }} />
          {castDraftOpen ? <p className="movie-form__hint" role="status">Spara eller avbryt skådespelarens redigering innan du sparar filmen eller hämtar en annan film.</p> : null}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-light" onClick={onClose} disabled={saving}>{saved ? 'Stäng' : 'Avbryt'}</button>
          <button type="submit" className={`btn ${saved ? 'btn-success' : 'btn-danger'}`} disabled={locked || castDraftOpen || saved}>
            {saving ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
            {saving ? 'Sparar…' : saved ? 'Sparad!' : movieId === null ? 'Lägg till film' : 'Spara ändringar'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
