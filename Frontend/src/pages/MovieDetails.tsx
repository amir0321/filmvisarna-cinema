import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { StarRatingBadge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { FilterPill, LOW_SEATS_DETAIL_THRESHOLD } from '../components/Pills'
import { Poster } from '../components/Poster'
import { CardListSkeleton, Skeleton } from '../components/Skeleton'
import TrailerModal from '../components/TrailerModal'
import { useMovie } from '../hooks/useMovies'
import { useScreenings } from '../hooks/useScreenings'
import type { Screening } from '../types/screening'
import {
  formatShowtimeDayLabel,
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

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours <= 0) return `${mins} min`
  if (mins === 0) return `${hours} tim`
  return `${hours} tim ${mins} min`
}

function getScreeningFormat(cinemaName: string): string {
  return cinemaName.toLowerCase().includes('stora') ? '4K Laser · Atmos' : '2D'
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

  const selectedScreenings: Screening[] = useMemo(
    () => screeningsByDate.find(([date]) => date === activeDate)?.[1] ?? [],
    [screeningsByDate, activeDate],
  )

  const screeningsByCinema = useMemo(() => {
    const groups = new Map<string, Screening[]>()
    for (const screening of selectedScreenings) {
      const list = groups.get(screening.cinema) ?? []
      list.push(screening)
      groups.set(screening.cinema, list)
    }
    return Array.from(groups.entries())
  }, [selectedScreenings])

  if (loading) {
    return (
      <div className='movie-details-page full-bleed' role='status' aria-busy='true'>
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
              <Skeleton variant='rect' height='200px' className='rounded-4' />
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

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null

  return (
    <div className='movie-details-page full-bleed'>
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
          <i className='bi bi-chevron-left' aria-hidden='true' />
          <span>Tillbaka</span>
        </Link>

        {movie.trailer_url && (
          <button
            type='button'
            className='movie-details-hero__play'
            aria-label={`Spela trailer för ${movie.title}`}
            onClick={() => setSearchParams({ trailer: '1' }, { replace: true })}
          >
            <i className='bi bi-play-fill' aria-hidden='true' />
          </button>
        )}
      </section>

      <div className='movie-details-content'>
        <div className='movie-details-grid'>
          {/* Titelblock: visas överst på mobil (< 1024px) och överst i högerkolumnen på desktop */}
          <header className='movie-details-header'>
            <div className='movie-details-meta-row'>
              {movie.genres.map((genre) => (
                <span key={genre} className='genre-badge'>
                  {genre}
                </span>
              ))}
              {movie.imdb_rating != null && (
                <StarRatingBadge rating={movie.imdb_rating} className='ms-1' />
              )}
            </div>

            <h1 className='movie-details-title'>{movie.title}</h1>

            {movie.director && (
              <p className='movie-details-director'>
                Regi: {movie.director}
              </p>
            )}
          </header>

          {/* Vänster kolumn: affisch och faktaruta */}
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
              <h2 className='movie-details-facts__heading'>Fakta</h2>

              <div className='movie-details-facts__row'>
                <span className='movie-details-facts__label'>Åldersgräns</span>
                <span className='movie-details-facts__value'>
                  {formatAgeRating(movie.age_rating)}
                </span>
              </div>

              <div className='movie-details-facts__row'>
                <span className='movie-details-facts__label'>Premiärår</span>
                <span className='movie-details-facts__value'>
                  {releaseYear ?? 'Ej angiven'}
                </span>
              </div>

              <div className='movie-details-facts__row'>
                <span className='movie-details-facts__label'>Speltid</span>
                <span className='movie-details-facts__value'>
                  {formatRuntime(movie.duration_minutes)}
                </span>
              </div>

              <div className='movie-details-facts__row'>
                <span className='movie-details-facts__label'>Originaltitel</span>
                <span className='movie-details-facts__value'>{movie.title}</span>
              </div>

              {movie.imdb_rating != null && (
                <div className='movie-details-facts__row'>
                  <span className='movie-details-facts__label'>IMDb</span>
                  <span className='movie-details-facts__value'>
                    ★ {movie.imdb_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </aside>

          {/* Höger kolumn: synopsis, medverkande och visningsschema */}
          <div className='movie-details-body'>
            <p className='movie-details-synopsis'>
              {movie.description || 'Synopsis saknas.'}
            </p>

            {movie.actors && movie.actors.length > 0 && (
              <section className='movie-details-cast' aria-label='Medverkande'>
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

            <section className='screening-section' aria-label='Visningsschema'>
              <h2 className='screening-section__title'>Visningsschema</h2>

              {screeningsByDate.length > 0 && (
                <div className='screening-date-chips' role='group' aria-label='Välj datum'>
                  {screeningsByDate.map(([date]) => (
                    <FilterPill
                      key={date}
                      active={activeDate === date}
                      onClick={() => setSelectedDate(date)}
                    >
                      {formatShowtimeDayLabel(date)}
                    </FilterPill>
                  ))}
                </div>
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

              {!screeningsLoading && !screeningsError && screeningsByCinema.length > 0 && (
                <div className='screening-cinema-groups'>
                  {screeningsByCinema.map(([cinemaName, cinemaScreenings]) => {
                    const isStora = cinemaName.toLowerCase().includes('stora')
                    return (
                      <div key={cinemaName} className='screening-cinema-group'>
                        <h3 className='screening-cinema-group__title'>
                          <span
                            className={`screening-cinema-group__dot ${
                              isStora
                                ? 'screening-cinema-group__dot--primary'
                                : 'screening-cinema-group__dot--info'
                            }`}
                            aria-hidden='true'
                          />
                          {cinemaName}
                        </h3>

                        <div className='screening-rows'>
                          {cinemaScreenings.map((screening) => {
                            const seatsLeft = screening.availableSeats
                            const isSoldOut = seatsLeft !== undefined && seatsLeft <= 0
                            const isLow =
                              seatsLeft !== undefined &&
                              seatsLeft > 0 &&
                              seatsLeft < LOW_SEATS_DETAIL_THRESHOLD

                            return (
                              <div key={screening.id} className='screening-row'>
                                <div className='screening-row__left'>
                                  <span className='screening-row__start'>
                                    {formatTime(screening.startsAt)}
                                  </span>
                                  <span className='screening-row__end'>
                                    –{formatTime(screening.endsAt)}
                                  </span>
                                  <span className='screening-row__format'>
                                    {getScreeningFormat(screening.cinema)}
                                  </span>
                                </div>

                                <div className='screening-row__right'>
                                  <span
                                    className={`screening-row__seats${
                                      isLow || isSoldOut ? ' screening-row__seats--low' : ''
                                    }`}
                                  >
                                    {isSoldOut
                                      ? 'Fullbokad'
                                      : `${seatsLeft ?? '–'} platser kvar`}
                                  </span>

                                  <Link
                                    to={getBookingUrl(screening.id)}
                                    className='screening-row__cta'
                                  >
                                    Välj platser
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
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
