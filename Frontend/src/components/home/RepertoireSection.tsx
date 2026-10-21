import type { Movie, Screening } from '../../types'
import MovieCard from './MovieCard'
import './RepertoireSection.scss'

interface RepertoireSectionProps {
  heading: string
  movies: Movie[]
  screenings: Screening[]
  loading: boolean
  error: string | null
}

interface MovieWithScreenings {
  movie: Movie
  screenings: Screening[]
}

// Groups screenings per movie. Screenings arrive sorted by start time,
// so movies end up ordered by their earliest screening.
function groupScreeningsByMovie(movies: Movie[], screenings: Screening[]): MovieWithScreenings[] {
  const moviesById = new Map(movies.map((movie) => [movie.id, movie]))
  const groups = new Map<number, MovieWithScreenings>()

  for (const screening of screenings) {
    const movie = moviesById.get(screening.movieId)
    if (!movie) continue

    const group = groups.get(movie.id)
    if (group) {
      group.screenings.push(screening)
    } else {
      groups.set(movie.id, { movie, screenings: [screening] })
    }
  }

  return [...groups.values()]
}

const SKELETON_CARD_COUNT = 4

export default function RepertoireSection({
  heading,
  movies,
  screenings,
  loading,
  error,
}: RepertoireSectionProps) {
  const groups = groupScreeningsByMovie(movies, screenings)

  let statusMessage = ''
  if (loading) statusMessage = 'Laddar visningar…'
  else if (!error) statusMessage = `${groups.length} ${groups.length === 1 ? 'film' : 'filmer'} visas`

  return (
    <section className="container home-container py-5" aria-labelledby="repertoire-heading">
      <h2 id="repertoire-heading" className="repertoire-section__heading mb-4">
        {heading}
      </h2>

      {/* Announces result changes to screen readers when the filters change */}
      <p className="visually-hidden" role="status">
        {statusMessage}
      </p>

      {error && (
        <div className="alert alert-danger" role="alert">
          Det gick inte att hämta repertoaren. Försök igen om en stund.
        </div>
      )}

      {!error && loading && (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4" aria-hidden="true">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
            <div key={index} className="col">
              <div className="movie-card placeholder-glow">
                <div className="movie-card__image placeholder w-100"></div>
                <div className="movie-card__body">
                  <span className="placeholder col-8 mb-2 rounded"></span>
                  <span className="placeholder col-5 mb-3 rounded"></span>
                  <span className="placeholder col-10 rounded"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!error && !loading && groups.length === 0 && (
        <div className="repertoire-section__empty text-center py-5">
          <i className="bi bi-calendar-x fs-1 d-block mb-3 opacity-50" aria-hidden="true"></i>
          <p className="mb-0">Inga visningar hittades för vald dag och åldersgräns.</p>
        </div>
      )}

      {!error && !loading && groups.length > 0 && (
        <ul className="list-unstyled row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4 mb-0">
          {groups.map(({ movie, screenings: movieScreenings }) => (
            <li key={movie.id} className="col">
              <MovieCard movie={movie} screenings={movieScreenings} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
