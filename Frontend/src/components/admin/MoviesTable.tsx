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

const SCREENINGS_MESSAGE = 'Filmen har registrerade visningar och kan därför inte tas bort. Ta först bort filmens visningar. Även tidigare visningar räknas.'

function hasScreenings(movie: Movie): boolean {
  return (movie.total_screenings_count ?? 0) > 0 || (movie.active_screenings_count ?? 0) > 0
}

function MoviePoster({ movie }: { movie: Movie }) {
  return <Poster src={isSafeImageUrl(movie.poster_url) ? movie.poster_url : null} alt="" title={movie.title} size="sm" />
}

function MovieGenres({ movie }: { movie: Movie }) {
  return (
    <div className="admin-movie-genres">
      {[...new Set(movie.genres)].map(genre => <Badge key={genre} variant="genre" pill>{genre}</Badge>)}
    </div>
  )
}

function ScreeningCount({ movie }: { movie: Movie }) {
  const upcoming = movie.active_screenings_count
  const total = movie.total_screenings_count
  return (
    <span className="admin-movie-count">
      <span>{upcoming !== undefined ? `${upcoming} kommande` : total !== undefined ? `${total} totalt` : 'Antal saknas'}</span>
      {upcoming !== undefined && total !== undefined ? <small>{total} totalt</small> : null}
    </span>
  )
}

function MovieActions({ movie, onEdit, onDelete, pending }: {
  movie: Movie
  onEdit: MoviesTableProps['onEdit']
  onDelete: MoviesTableProps['onDelete']
  pending: boolean
}) {
  const blocked = hasScreenings(movie)
  return (
    <div className="admin-movie-actions">
      <fieldset className="admin-movie-actions__buttons" disabled={pending} aria-label={`Åtgärder för ${movie.title}`}>
        <button type="button" className="btn btn-sm admin-table__edit" onClick={() => onEdit(movie)}>
          <i className="bi bi-pencil-fill me-1" aria-hidden="true" />Redigera
        </button>
        <InlineConfirmAction label="Ta bort" confirmLabel="Ja, ta bort" onConfirm={() => onDelete(movie)} disabled={blocked || pending} />
      </fieldset>
      {blocked ? <p className="admin-movie-actions__reason"><i className="bi bi-info-circle me-1" aria-hidden="true" />{SCREENINGS_MESSAGE}</p> : null}
    </div>
  )
}

export default function MoviesTable({ movies, onEdit, onDelete }: MoviesTableProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deleting = useRef(false)

  async function handleDelete(movie: Movie) {
    if (deleting.current) return
    if (hasScreenings(movie)) {
      setError(`${movie.title}: ${SCREENINGS_MESSAGE}`)
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
        : 'Det gick inte att ta bort filmen. Försök igen.'
      setError(`${movie.title}: ${message}`)
    } finally {
      deleting.current = false
      setPending(false)
    }
  }

  if (movies.length === 0) return <EmptyState title="Inga filmer" description="Det finns inga filmer att visa för ditt urval." />

  return (
    <div className="admin-movies-list" aria-busy={pending}>
      {error ? <InlineFeedback variant="danger" message={error} className="mb-3" /> : null}
      <div className="admin-table-card admin-movies-table d-none d-md-block">
        <div className="table-responsive">
          <table className="admin-table">
            <caption className="visually-hidden">Filmarkiv med genrer, åldersgräns, speltid, regissör och visningar.</caption>
            <thead><tr>
              <th scope="col">Film</th><th scope="col">Ålder</th><th scope="col">Speltid</th>
              <th scope="col">Regissör</th><th scope="col">Visningar</th><th scope="col" className="text-end">Åtgärder</th>
            </tr></thead>
            <tbody>
              {movies.map(movie => (
                <tr key={movie.id}>
                  <th scope="row"><div className="admin-movie-heading"><MoviePoster movie={movie} /><div><span className="admin-table__title">{movie.title}</span><MovieGenres movie={movie} /></div></div></th>
                  <td><AgeBadge ageRating={movie.age_rating} variant="admin" /></td>
                  <td className="text-nowrap">{formatDuration(movie.duration_minutes)}</td>
                  <td>{movie.director || 'Ej angiven'}</td>
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
              <dl><div><dt>Regissör</dt><dd>{movie.director || 'Ej angiven'}</dd></div><div><dt>Visningar</dt><dd><ScreeningCount movie={movie} /></dd></div></dl>
              <MovieActions movie={movie} onEdit={onEdit} onDelete={handleDelete} pending={pending} />
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
