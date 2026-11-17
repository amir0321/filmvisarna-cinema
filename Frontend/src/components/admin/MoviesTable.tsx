import { translateApiError, translateGenre } from '../../i18n/mappers'
import { sv } from '../../i18n/sv'
import { useTranslation } from '../../context/LocaleContext'
import { useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import type { Movie } from '../../types/movie'
import { isSafeImageUrl } from '../../utils/imageValidation'
import { formatDuration } from '../../utils/movie'
import { AgeBadge, Badge } from '../Badge'
import { EmptyState } from '../EmptyState'
import { Poster } from '../Poster'
import { InlineConfirmAction, InlineFeedback } from '../Toast'

export interface MoviesTableProps {
  movies: Movie[]
  onEdit: (movie: Movie) => void
  onDelete: (movie: Movie) => Promise<void>
}

const SCREENINGS_MESSAGE = sv['admin.movies.hasScreenings']

function hasScreenings(movie: Movie): boolean {
  return (movie.total_screenings_count ?? 0) > 0 || (movie.active_screenings_count ?? 0) > 0
}

function MoviePoster({ movie }: { movie: Movie }) {
  return <Poster src={isSafeImageUrl(movie.poster_url) ? movie.poster_url : null} alt="" title={movie.title} size="sm" />
}

function MovieGenres({ movie }: { movie: Movie }) {
  const { locale } = useTranslation()
  return (
    <div className="admin-movie-genres">
      {[...new Set(movie.genres)].map(genre => <Badge key={genre} variant="genre" pill>{translateGenre(genre, locale)}</Badge>)}
    </div>
  )
}

function ScreeningCount({ movie }: { movie: Movie }) {
  const { t } = useTranslation()
  const upcoming = movie.active_screenings_count
  const total = movie.total_screenings_count
  return (
    <span className="admin-movie-count">
      <span>{upcoming !== undefined ? t('admin.movies.upcomingCount', { count: upcoming }) : total !== undefined ? t('admin.movies.totalCount', { count: total }) : t('admin.movies.missingCount')}</span>
      {upcoming !== undefined && total !== undefined ? <small>{t('admin.movies.totalCount', { count: total })}</small> : null}
    </span>
  )
}

function MovieActions({ movie, onEdit, onDelete, pending }: {
  movie: Movie
  onEdit: MoviesTableProps['onEdit']
  onDelete: MoviesTableProps['onDelete']
  pending: boolean
}) {
  const { t } = useTranslation()
  const blocked = hasScreenings(movie)
  return (
    <div className="admin-movie-actions">
      <fieldset className="admin-movie-actions__buttons" disabled={pending} aria-label={t('admin.movies.actionsFor', { title: movie.title })}>
        <button type="button" className="btn btn-sm admin-table__edit" onClick={() => onEdit(movie)}>
          <i className="bi bi-pencil-fill me-1" aria-hidden="true" />{t('admin.edit')}
        </button>
        <InlineConfirmAction label={t('admin.delete')} confirmLabel={t('admin.confirmDelete')} onConfirm={() => onDelete(movie)} disabled={blocked || pending} />
      </fieldset>
      {blocked ? <p className="admin-movie-actions__reason"><i className="bi bi-info-circle me-1" aria-hidden="true" />{t('admin.movies.hasScreenings')}</p> : null}
    </div>
  )
}

export default function MoviesTable({ movies, onEdit, onDelete }: MoviesTableProps) {
  const { t, locale } = useTranslation()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(null)
  const deleting = useRef(false)

  async function handleDelete(movie: Movie) {
    if (deleting.current) return
    if (hasScreenings(movie)) {
      setError({ title: movie.title, message: SCREENINGS_MESSAGE })
      return
    }
    deleting.current = true
    setPending(true)
    setError(null)
    try {
      await onDelete(movie)
    } catch (err) {
      const message = err instanceof ApiError
        ? err.status === 409 ? SCREENINGS_MESSAGE : err.message
        : t('admin.movies.deleteError')
      setError({ title: movie.title, message })
    } finally {
      deleting.current = false
      setPending(false)
    }
  }

  if (movies.length === 0) return <EmptyState title={t('admin.movies.empty')} description={t('admin.movies.emptySelection')} />

  return (
    <div className="admin-movies-list" aria-busy={pending}>
      {error ? <InlineFeedback variant="danger" message={t('admin.movies.errorFor', { title: error.title, error: translateApiError(error.message, locale) })} className="mb-3" /> : null}
      <div className="admin-table-card admin-movies-table d-none d-md-block">
        <div className="table-responsive">
          <table className="admin-table">
            <caption className="visually-hidden">{t('admin.movies.tableCaption')}</caption>
            <thead><tr>
              <th scope="col">{t('member.film')}</th><th scope="col">{t('admin.movies.age')}</th><th scope="col">{t('movie.duration')}</th>
              <th scope="col">{t('admin.movies.director')}</th><th scope="col">{t('admin.movies.screenings')}</th><th scope="col" className="text-end">{t('admin.actions')}</th>
            </tr></thead>
            <tbody>
              {movies.map(movie => (
                <tr key={movie.id}>
                  <th scope="row"><div className="admin-movie-heading"><MoviePoster movie={movie} /><div><span className="admin-table__title">{movie.title}</span><MovieGenres movie={movie} /></div></div></th>
                  <td><AgeBadge ageRating={movie.age_rating} variant="admin" /></td>
                  <td className="text-nowrap">{formatDuration(movie.duration_minutes)}</td>
                  <td>{movie.director || t('movieDetails.notSpecified')}</td>
                  <td><ScreeningCount movie={movie} /></td>
                  <td><MovieActions movie={movie} onEdit={onEdit} onDelete={handleDelete} pending={pending} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ul className="admin-movie-cards d-md-none">
        {movies.map(movie => (
          <li key={movie.id}>
            <article className="admin-movie-card" aria-label={movie.title}>
              <header className="admin-movie-heading">
                <MoviePoster movie={movie} />
                <div><h3>{movie.title}</h3><MovieGenres movie={movie} /></div>
              </header>
              <div className="admin-movie-card__meta"><AgeBadge ageRating={movie.age_rating} variant="admin" /><span>{formatDuration(movie.duration_minutes)}</span></div>
              <dl><div><dt>{t('admin.movies.director')}</dt><dd>{movie.director || t('movieDetails.notSpecified')}</dd></div><div><dt>{t('admin.movies.screenings')}</dt><dd><ScreeningCount movie={movie} /></dd></div></dl>
              <MovieActions movie={movie} onEdit={onEdit} onDelete={handleDelete} pending={pending} />
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
