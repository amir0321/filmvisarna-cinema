import { useState, useMemo } from 'react'
import { useMovies } from '../hooks'
import { AgeBadge, Badge, StarRatingBadge } from '../components/Badge'
import { FilterPillGroup } from '../components/Pills'
import { Poster } from '../components/Poster'
import { MovieGridSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'

const AGE_OPTIONS = [
  { value: 'all', label: 'Alla åldrar' },
  { value: '0', label: 'Barntillåten' },
  { value: '7', label: 'Från 7 år' },
  { value: '11', label: 'Från 11 år' },
  { value: '15', label: 'Från 15 år' },
]

export default function Movies() {
  const { data: movies, loading, error, refetch } = useMovies()
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [selectedAge, setSelectedAge] = useState<string>('all')

  const movieList = useMemo(() => movies || [], [movies])

  // Extract unique genres from movies
  const genreOptions = useMemo(() => {
    const genresSet = new Set<string>()
    movieList.forEach((movie) => {
      movie.genres?.forEach((g) => genresSet.add(g))
    })
    const list = Array.from(genresSet).sort().map((g) => ({
      value: g,
      label: g,
    }))
    return [{ value: 'all', label: 'Alla genrer' }, ...list]
  }, [movieList])

  // Filter movies based on selected genre and age
  const filteredMovies = useMemo(() => {
    return movieList.filter((movie) => {
      if (selectedGenre !== 'all' && !movie.genres?.includes(selectedGenre)) {
        return false
      }
      if (selectedAge !== 'all') {
        const rawAge = movie.age_rating != null ? String(movie.age_rating).trim() : ''
        const movieAge = parseInt(rawAge, 10) || 0
        const targetAge = parseInt(selectedAge, 10)

        if (targetAge === 0 && movieAge !== 0) return false
        if (targetAge > 0 && movieAge > targetAge) return false
      }
      return true
    })
  }, [movieList, selectedGenre, selectedAge])

  const hasActiveFilters = selectedGenre !== 'all' || selectedAge !== 'all'

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Aktuella filmer</h1>
          <p className="text-secondary mb-0">Här visas alla filmer som går på bio just nu.</p>
        </div>
      </div>

      {/* Filter bars using FilterPillGroup */}
      {!loading && !error && movieList.length > 0 ? (
        <div className="d-flex flex-column gap-3 mb-4">
          <div className="d-flex flex-column gap-2">
            <span className="text-secondary small text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
              Genre
            </span>
            <FilterPillGroup
              ariaLabel="Filtrera efter genre"
              variant="genre"
              options={genreOptions}
              value={selectedGenre}
              onChange={setSelectedGenre}
            />
          </div>

          <div className="d-flex flex-column gap-2">
            <span className="text-secondary small text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
              Åldersgräns
            </span>
            <FilterPillGroup
              ariaLabel="Filtrera efter åldersgräns"
              variant="age"
              options={AGE_OPTIONS}
              value={selectedAge}
              onChange={setSelectedAge}
            />
          </div>
        </div>
      ) : null}

      {/* Loading state */}
      {loading ? (
        <MovieGridSkeleton count={8} />
      ) : null}

      {/* Error state */}
      {error ? (
        <EmptyState
          variant="error"
          title="Kunde inte ladda filmer"
          description={error}
          actionLabel="Försök igen"
          onAction={refetch}
        />
      ) : null}

      {/* Empty state when no movies match filters */}
      {!loading && !error && filteredMovies.length === 0 ? (
        <EmptyState
          variant="empty"
          title="Inga filmer hittades"
          description={
            hasActiveFilters
              ? 'Inga filmer matchar dina valda filter. Prova att återställa filtreringen.'
              : 'Det finns inga aktuella filmer på repertoaren just nu.'
          }
          actionLabel={hasActiveFilters ? 'Rensa filter' : undefined}
          onAction={
            hasActiveFilters
              ? () => {
                  setSelectedGenre('all')
                  setSelectedAge('all')
                }
              : undefined
          }
        />
      ) : null}

      {/* Movie grid */}
      {!loading && !error && filteredMovies.length > 0 ? (
        <div className="row g-4">
          {filteredMovies.map((movie) => {
            const duration = movie.duration_minutes ?? movie.duration
            const genre = movie.genres?.[0] || 'Långfilm'

            return (
              <div key={movie.id} className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 shadow-sm border-0 bg-card text-light overflow-hidden">
                  <Poster
                    src={movie.poster_url}
                    alt={movie.title}
                    title={movie.title}
                    hoverZoom={true}
                    topLeftBadge={
                      movie.age_rating ? (
                        <AgeBadge ageRating={movie.age_rating} variant="poster-filmer" />
                      ) : null
                    }
                    topRightBadge={
                      duration ? (
                        <Badge variant="runtime">{duration} min</Badge>
                      ) : null
                    }
                  />
                  <div className="card-body d-flex flex-column p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge variant="danger">{genre}</Badge>
                      {movie.imdb_rating ? (
                        <StarRatingBadge rating={movie.imdb_rating} />
                      ) : null}
                    </div>
                    <h2 className="card-title h5 fw-bold text-white mb-2">{movie.title}</h2>
                    {duration ? (
                      <p className="text-secondary small mb-3">
                        <i className="bi bi-clock me-1" aria-hidden="true"></i> {duration} minuter
                      </p>
                    ) : null}
                    <div className="mt-auto pt-2">
                      <button type="button" className="btn btn-outline-danger w-100 btn-sm">
                        Boka biljetter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
