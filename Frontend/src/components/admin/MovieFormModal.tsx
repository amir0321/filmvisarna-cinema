import { translateApiError } from '../../i18n/mappers'
import { sv } from '../../i18n/sv'
import { useTranslation } from '../../context/LocaleContext'
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
  return error.message === sv['api.validation']
    ? sv['admin.movieForm.validation'] : error.message
}

export default function MovieFormModal({ movie, onClose, onSaved }: MovieFormModalProps) {
  const { t, locale } = useTranslation()
  const id = useId()
  const [values, setValues] = useState(() => initialMovieValues(movie))
  const [movieId, setMovieId] = useState(movie?.id ?? null)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<SearchState>({ query: '', results: [], loading: false, error: null })
  const [retry, setRetry] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importNotice, setImportNotice] = useState<{ title: string; missingDuration: boolean } | null>(null)
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
          error: errorMessage(err, sv['admin.movieForm.searchError']) })
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
      setImportNotice({ title: `${details.title}${details.originalTitle && details.originalTitle !== details.title ? ` (${details.originalTitle})` : ''}`, missingDuration: !details.duration_minutes })
    } catch (err) {
      if (!controller.signal.aborted) setError(errorMessage(err, sv['admin.movieForm.importError']))
    } finally {
      if (importRef.current === controller) importRef.current = null
      if (!controller.signal.aborted) setImporting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveRef.current || locked || saved) return
    if (castDraftOpen) { setError(sv['admin.movieForm.finishActor']); return }
    const validation = posterError || validateMovieValues(values, locale)
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
      if (!controller.signal.aborted) setError(errorMessage(err, sv['admin.movieForm.saveError']))
    } finally {
      saveRef.current = null
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={() => { if (!saving) onClose() }} title={movieId === null ? t('admin.movies.add') : t('admin.movieForm.edit')} size="lg">
      <form className="movie-form" onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {error ? <div ref={errorRef} tabIndex={-1}><InlineFeedback variant="danger" message={translateApiError(error, locale)} className="mb-3" /></div> : null}
          {saved ? <InlineFeedback variant="success" message={t('admin.saved')} className="mb-3" /> : null}
          <fieldset className="movie-form__import" disabled={locked || castDraftOpen}>
            <legend>{t('admin.movieForm.importLegend')}</legend>
            <label htmlFor={`${id}-tmdb`} className="form-label">{t('admin.movieForm.searchLabel')}</label>
            <input id={`${id}-tmdb`} type="search" className="form-control" value={query} maxLength={120} placeholder={t('admin.movieForm.searchPlaceholder')}
              onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault() }} aria-describedby={`${id}-search-status`} />
            <p className="movie-form__hint">{t('admin.movieForm.replaceHint')}</p>
            <p id={`${id}-search-status`} className="movie-form__hint" role="status">
              {searchLoading ? t('admin.movieForm.searching') : canSearch && currentSearch && !currentSearch.error && currentSearch.results.length === 0 ? t('admin.movieForm.searchEmpty') : null}
            </p>
            {canSearch && currentSearch?.error ? <><InlineFeedback variant="danger" message={translateApiError(currentSearch.error, locale)} /><button type="button" className="btn btn-sm btn-secondary-outline mt-2" onClick={() => setRetry(count => count + 1)}>{t('common.retry')}</button></> : null}
            {canSearch && currentSearch && !currentSearch.loading && currentSearch.results.length > 0 ? (
              <ul className="movie-form__suggestions" aria-label={t('admin.movieForm.suggestions')}>
                {currentSearch.results.map(suggestion => <li key={suggestion.tmdbId}><button type="button" onClick={() => void importMovie(suggestion.tmdbId)}>
                  <Poster src={isSafeImageUrl(suggestion.posterUrl) ? suggestion.posterUrl : null} alt="" title={suggestion.title} size="sm" />
                  <span><strong>{suggestion.title}</strong><small>{suggestion.releaseYear ?? t('admin.movieForm.missingYear')}{suggestion.originalTitle !== suggestion.title ? ` · ${suggestion.originalTitle}` : ''}</small></span>
                  <i className="bi bi-download" aria-hidden="true" />
                </button></li>)}
              </ul>
            ) : null}
          </fieldset>
          {importing ? <p role="status" className="movie-form__hint"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />{t('admin.movieForm.importing')}</p> : null}
          {importNotice ? <InlineFeedback variant="info" message={`${t('admin.movieForm.imported', { title: importNotice.title })}${importNotice.missingDuration ? ` ${t('admin.movieForm.missingDuration')}` : ''}`} className="mb-3" /> : null}

          <fieldset className="movie-form__fields" disabled={locked}>
            <legend className="visually-hidden">{t('admin.movieForm.details')}</legend>
            <div className="movie-form__grid">
              <div className="movie-form__wide"><label htmlFor={`${id}-title`} className="form-label">{t('admin.movieForm.title')}</label><input id={`${id}-title`} className="form-control" value={values.title} maxLength={300} required onChange={event => change('title', event.target.value)} /></div>
              <div className="movie-form__wide"><label htmlFor={`${id}-description`} className="form-label">{t('admin.movieForm.description')}</label><textarea id={`${id}-description`} className="form-control" value={values.description} maxLength={2000} rows={4} onChange={event => change('description', event.target.value)} /></div>
              <div><label htmlFor={`${id}-duration`} className="form-label">{t('admin.movieForm.duration')}</label><input id={`${id}-duration`} type="number" min={1} step={1} className="form-control" value={values.duration_minutes} required onChange={event => change('duration_minutes', event.target.value)} /></div>
              <div><label htmlFor={`${id}-age`} className="form-label">{t('filter.ageLimit')}</label><input id={`${id}-age`} className="form-control" list={`${id}-ages`} value={values.age_rating} maxLength={10} placeholder={t('admin.movieForm.agePlaceholder')} onChange={event => change('age_rating', event.target.value)} /><datalist id={`${id}-ages`}>{['Alla', '7', '11', '15'].map(age => <option key={age} value={age} label={age === 'Alla' ? t('common.all') : age} />)}</datalist></div>
              <div><label htmlFor={`${id}-director`} className="form-label">{t('admin.movies.director')}</label><input id={`${id}-director`} className="form-control" value={values.director} maxLength={200} onChange={event => change('director', event.target.value)} /></div>
              <div><label htmlFor={`${id}-rating`} className="form-label">{t('admin.movieForm.rating')}</label><input id={`${id}-rating`} type="number" min={0} max={10} step="0.1" className="form-control" value={values.imdb_rating} onChange={event => change('imdb_rating', event.target.value)} /><small className="movie-form__hint">{t('admin.movieForm.ratingHint')}</small></div>
              <div><label htmlFor={`${id}-date`} className="form-label">{t('admin.movieForm.releaseDate')}</label><input id={`${id}-date`} type="date" className="form-control" value={values.release_date} onChange={event => change('release_date', event.target.value)} /></div>
              <div><label htmlFor={`${id}-genres`} className="form-label">{t('movie.genres')}</label><input id={`${id}-genres`} className="form-control" value={values.genres} onChange={event => change('genres', event.target.value)} /><small className="movie-form__hint">{t('admin.movieForm.genresHint')}</small></div>
            </div>

            <div className="movie-form__artwork">
              <div className="movie-form__poster-preview"><Poster src={posterSrc} alt={t('admin.movieForm.posterPreview')} title={values.title || t('admin.movieForm.poster')} size="md" /><span>{t('admin.preview')}</span></div>
              <div className="movie-form__poster-fields">
                <label htmlFor={`${id}-poster-file`} className="form-label">{t('admin.movieForm.uploadPoster')}</label>
                <input ref={fileInputRef} id={`${id}-poster-file`} type="file" className="form-control" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" onChange={selectPoster} aria-invalid={posterError !== null} aria-describedby={`${id}-poster-help`} />
                <p id={`${id}-poster-help`} className="movie-form__hint">{t('admin.movieForm.posterHelp')}{posterFile ? ` ${t('admin.file.selected', { name: posterFile.name })}` : ''}</p>
                {posterError ? <InlineFeedback variant="danger" message={translateApiError(posterError, locale)} /> : null}
                <label htmlFor={`${id}-poster-url`} className="form-label">{t('admin.movieForm.posterUrl')}</label>
                <input id={`${id}-poster-url`} className="form-control" inputMode="url" maxLength={2048} value={values.poster_url} onChange={event => { releasePosterPreview(); setPosterError(null); change('poster_url', event.target.value) }} />
                <button type="button" className="btn btn-sm btn-secondary-outline mt-2" onClick={() => { releasePosterPreview(); setPosterError(null); change('poster_url', '') }}>{t('admin.movieForm.removePoster')}</button>
              </div>
            </div>
            <div className="movie-form__grid">
              <div className="movie-form__wide"><label htmlFor={`${id}-landscape`} className="form-label">{t('admin.movieForm.landscapeUrl')}</label><input id={`${id}-landscape`} className="form-control" inputMode="url" maxLength={2048} value={values.landscape_image_url} onChange={event => change('landscape_image_url', event.target.value)} /><small className="movie-form__hint">{t('admin.movieForm.imageUrlHint')}</small></div>
              <div className="movie-form__wide"><label htmlFor={`${id}-trailer`} className="form-label">{t('admin.movieForm.trailerUrl')}</label><input id={`${id}-trailer`} className="form-control" inputMode="url" maxLength={2048} value={values.trailer_url} onChange={event => change('trailer_url', event.target.value)} /></div>
            </div>
          </fieldset>

          <CastMemberEditor key={castVersion} value={values.cast_members} onChange={members => change('cast_members', members)} disabled={locked}
            onDraftChange={open => { setCastDraftOpen(open); if (open) setSaved(false) }} />
          {castDraftOpen ? <p className="movie-form__hint" role="status">{t('admin.movieForm.castDraftHint')}</p> : null}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary-outline" onClick={onClose} disabled={saving}>{saved ? t('common.close') : t('admin.abort')}</button>
          <button type="submit" className={`btn ${saved ? 'btn-success' : 'btn-danger'}`} disabled={locked || castDraftOpen || saved}>
            {saving ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
            {saving ? t('admin.saving') : saved ? t('admin.saved') : movieId === null ? t('admin.movies.add') : t('profile.save')}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
