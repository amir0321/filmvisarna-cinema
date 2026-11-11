import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { Poster } from '../components/Poster'
import { CardListSkeleton, Skeleton } from '../components/Skeleton'
import TrailerModal from '../components/TrailerModal'
import { useMovie } from '../hooks/useMovies'
import { useScreenings } from '../hooks/useScreenings'
import type { Screening } from '../types/screening'
import {
  formatDateLong,
  formatDateShort,
  formatTime,
  toCinemaIsoDate,
} from '../utils/date'
import { getBookingUrl } from '../utils/links'

function formatAgeRating(ageRating: string | null): string {
  if (!ageRating) return 'Ej angiven'
  const normalized = ageRating.trim().toLowerCase()
  if (normalized === '0' || normalized === 'alla' || normalized === 'barntillåten') {
    return 'Alla åldrar'
  }
  return normalized.endsWith('år') ? ageRating : `${ageRating} år`
}

export default function MovieDetails() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isTrailerOpen = searchParams.get('trailer') === '1'
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [failedHeroSources, setFailedHeroSources] = useState<string[]>([])
  const { data: movie, loading, error, refetch } = useMovie(id)
  const {
    data: screenings,
    loading: screeningsLoading,
    error: screeningsError,
    refetch: refetchScreenings,
  } = useScreenings({ movieId: Number(id) })

  const screeningsByDate = useMemo(() => {
    const groups = new Map<string, Screening[]>()

    screenings?.forEach((screening) => {
      const date = toCinemaIsoDate(screening.startsAt)

      if (!groups.has(date)) {
        groups.set(date, [])
      }
      groups.get(date)!.push(screening)
    })
    return Array.from(groups.entries())
  }, [screenings])

  const activeDate =
    selectedDate && screeningsByDate.some(([date]) => date === selectedDate)
      ? selectedDate
      : screeningsByDate[0]?.[0] ?? null

  const selectedScreenings: Screening[] =
    screeningsByDate.find(([date]) => date === activeDate)?.[1] ?? []

  if (loading) {
    return (
      <div className='movie-details-page' role='status' aria-busy='true'>
        <span className='visually-hidden'>Laddar film…</span>
        <div className='movie-details-hero'>
          <Skeleton variant='rect' height='100%' />
        </div>
        <div className='movie-details-content'>
          <div className='movie-details-grid'>
            <div className='movie-details-header'>
              <Skeleton variant='pill' width='120px' height='28px' className='mb-3' />
              <Skeleton variant='text' width='65%' height='44px' className='mb-2' />
              <Skeleton variant='text' width='35%' height='20px' />
            </div>
            <div className='movie-details-sidebar'>
              <Skeleton variant='rect' height='420px' className='rounded-4 mb-4' />
              <Skeleton variant='rect' height='180px' className='rounded-4' />
            </div>
            <div className='movie-details-body'>
              <Skeleton variant='text' width='100%' height='80px' className='mb-4' />
              <CardListSkeleton count={2} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className='py-5'>
        <EmptyState
          variant='error'
          title='Filmen kunde inte hittas'
          description={
            error || 'Filmen kunde inte laddas. Kontrollera att länken är korrekt.'
          }
          actionLabel='Försök igen'
          onAction={refetch}
        />
      </div>
    )
  }

  const heroSrc = [movie.landscape_image_url, movie.poster_url].find(
    (source): source is string => Boolean(source && !failedHeroSources.includes(source)),
  )

  return (
    <div className='movie-details-page'>
      <section className='movie-details-hero'>
        {heroSrc && (
          <img
            src={heroSrc}
            alt=''
            className='movie-details-hero__image'
            onError={() =>
              setFailedHeroSources((prev) =>
                prev.includes(heroSrc) ? prev : [...prev, heroSrc],
              )
            }
          />
        )}

        <div className='movie-details-hero__overlay' />

        <Link to='/filmer' className='movie-details-hero__back'>
          <span aria-hidden='true'>←</span>
          Tillbaka
        </Link>

        {movie.trailer_url && (
          <button
            type='button'
            className='movie-details-hero__play'
            aria-label={`Spela trailer för ${movie.title}`}
            onClick={() => setSearchParams({ trailer: '1' }, { replace: true })}
          >
            ▶
          </button>
        )}
      </section>

      <div className='movie-details-content'>
        <div className='movie-details-grid'>
          {/* Titelblock: visas högst upp på mobil, och överst i högerkolumnen på desktop */}
          <header className='movie-details-header'>
            <div className='d-flex flex-wrap gap-2 mb-3'>
              {movie.genres.map((genre) => (
                <span key={genre} className='genre-badge'>
                  {genre}
                </span>
              ))}
            </div>

            <h1 className='movie-details-title mb-2'>{movie.title}</h1>

            {movie.director && (
              <p className='movie-details-director mb-0'>
                Regi: {movie.director}
              </p>
            )}
          </header>

          {/* Vänster kolumn: affisch och fakta */}
          <aside className='movie-details-sidebar'>
            <div className='movie-details-poster-column'>
              <Poster
                src={movie.poster_url}
                fallbackSrc={movie.landscape_image_url}
                alt={`Affisch för ${movie.title}`}
                title={movie.title}
                className='movie-details-poster'
              />
            </div>

            <div className='movie-details-facts'>
              <h2 className='h6 fw-bold text-secondary text-uppercase mb-3'>
                Fakta
              </h2>

              <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
                <strong>Åldersgräns</strong>
                <span>{formatAgeRating(movie.age_rating)}</span>
              </div>

              <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
                <strong>Speltid</strong>
                <span>{movie.duration_minutes} minuter</span>
              </div>

              <div className='d-flex justify-content-between gap-3 py-2'>
                <strong>Premiärår</strong>
                <span>
                  {movie.release_date
                    ? new Date(movie.release_date).getFullYear()
                    : 'Ej angiven'}
                </span>
              </div>
            </div>
          </aside>

          {/* Höger kolumn: synopsis, medverkande och visningar */}
          <div className='movie-details-body'>
            <div className='movie-details-main'>
              <p className='movie-details-synopsis'>
                {movie.description || 'Synopsis saknas.'}
              </p>

              {movie.actors && movie.actors.length > 0 && (
                <section className='movie-details-cast mt-4' aria-label='Medverkande'>
                  <h2 className='movie-details-cast__heading'>Medverkande</h2>
                  <div className='movie-details-cast__list'>
                    {movie.actors.map((actor) => (
                      <span key={actor} className='movie-details-cast__pill'>
                        {actor}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className='mt-5 screening-section'>
                <h2 className='h4 fw-bold mb-4'>Välj dag &amp; tid</h2>

                {screeningsByDate.length > 0 && (
                  <div className='d-flex flex-wrap gap-2 mb-4'>
                    {screeningsByDate.map(([date]) => (
                      <button
                        key={date}
                        type='button'
                        className={`btn ${
                          activeDate === date ? 'btn-danger' : 'btn-outline-secondary'
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        {formatDateShort(date)}
                      </button>
                    ))}
                  </div>
                )}

                {activeDate && (
                  <h3 className='screening-date-heading'>
                    {formatDateLong(activeDate)}
                  </h3>
                )}

                {screeningsLoading && <CardListSkeleton count={2} />}

                {!screeningsLoading && screeningsError && (
                  <div className='alert alert-danger' role='alert'>
                    Kunde inte ladda visningstider: {screeningsError}
                    <button
                      type='button'
                      className='btn btn-outline-danger btn-sm ms-3'
                      onClick={refetchScreenings}
                    >
                      Försök igen
                    </button>
                  </div>
                )}

                {!screeningsLoading &&
                  !screeningsError &&
                  (!screenings || screenings.length === 0) && (
                    <p className='text-secondary mb-0'>
                      Det finns inga kommande visningar för den här filmen.
                    </p>
                  )}

                {!screeningsLoading && !screeningsError && selectedScreenings.length > 0 && (
                  <>
                    <div className='screening-list'>
                      {selectedScreenings.map((screening) => (
                        <div key={screening.id} className='screening-card'>
                          <Link
                            to={getBookingUrl(screening.id)}
                            className='screening-card__link'
                          >
                            <div className='screening-card__time'>
                              <strong>{formatTime(screening.startsAt)}</strong>
                              <span>–{formatTime(screening.endsAt)}</span>
                            </div>

                            <div className='screening-card__details'>
                              <span>{screening.cinema}</span>

                              <span
                                className={`screening-card__seats ${
                                  screening.availableSeats == null
                                    ? ''
                                    : screening.availableSeats > 20
                                      ? 'screening-card__seats--high'
                                      : screening.availableSeats > 5
                                        ? 'screening-card__seats--medium'
                                        : 'screening-card__seats--low'
                                }`}
                              >
                                {screening.availableSeats ?? '-'} kvar
                              </span>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>

                    <p className='screening-info'>
                      Välj en tid ovan för att gå vidare till stolsväljaren.
                      Betalning sker i kassan.
                    </p>
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {movie.trailer_url && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setSearchParams({}, { replace: true })}
          trailerUrl={movie.trailer_url}
          movieTitle={movie.title}
        />
      )}
    </div>
  )
}
