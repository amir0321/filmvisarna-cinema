import { getBookingUrl } from '../utils/links'
import { useMemo, useState } from 'react'
import { useScreenings } from '../hooks/useScreenings'
import { Link, useParams, useSearchParams } from 'react-router'
import { useMovie } from '../hooks/useMovies'
import TrailerModal from '../components/TrailerModal'
import type { Screening } from '../types/screening'

export default function MovieDetails() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isTrailerOpen = searchParams.get('trailer') === '1'
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
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
      const date = new Date(screening.startsAt).toLocaleDateString('sv-SE')

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
    return <div className='py-4'>Laddar film...</div>
  }

  if (error || !movie) {
    return (
      <div className='py-4'>
        <h1 className='h2 fw-bold'>Filmen kunde inte hittas</h1>
        <p className='text-secondary'>Filmen kunde inte laddas. Kontrollera att länken är korrekt.
        </p>
        <button className='btn btn-outline-danger' onClick={refetch}>
          Försök igen
        </button>
      </div>
    )
  }

  return (
    <div className='movie-details-page'>
      <section className='movie-details-hero'>
        {movie.landscape_image_url && (
          <img
            src={movie.landscape_image_url}
            alt=''
            className='movie-details-hero__image'
          />
        )}

        <div className='movie-details-hero__overlay' />

        <Link to='/movies' className='movie-details-hero__back'>
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
        <div className='row g-4'>

          {/* Vänster kolumn */}
          <div className='col-12 col-md-4'>


            {/* Affisch */}
            <div className='movie-details-poster-column'>
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={`Affisch för ${movie.title}`}
                  className='movie-details-poster'
                />
              ) : (
                <div className='bg-card rounded-4 p-5 text-center'>
                  Ingen affisch tillgänglig
                </div>
              )}
            </div>
            { /* Fakta */}
            <div className='movie-details-facts'>
              <h2 className='h6 fw-bold text-secondary text-uppercase mb-3'>
                Fakta
              </h2>

              <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
                <strong>Åldersgräns</strong>
                <span>{movie.age_rating || 'Ej angiven'}</span>
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
          </div>

          {/* Höger kolumn: filminformation och visningar */}
          <div className='col-12 col-md-8'>
            <div className='d-flex flex-wrap gap-2 mb-3'>
              {movie.genres.map((genre) => (
                <span key={genre} className='genre-badge'>
                  {genre}
                </span>
              ))}
            </div>

            <h1 className='display-5 fw-bold mb-3'>{movie.title}</h1>

            {movie.director && (
              <p className='text-secondary mb-3'>
                Regi: {movie.director}
              </p>
            )}

            {/* Synopsis och visningar */}
            <div className='movie-details-main'>
              <p className='fs-5'>
                {movie.description || 'Synopsis saknas.'}
              </p>
              <section className='mt-5 screening-section'>
                <h2 className='h4 fw-bold mb-4'>Välj dag & tid</h2>

                {/* Datumväljare */}
                <div className='d-flex flex-wrap gap-2 mb-5'>
                  {screeningsByDate.map(([date]) => (
                    <button
                      key={date}
                      type='button'
                      className={`btn ${activeDate === date ? 'btn-danger' : 'btn-outline-secondary'
                        }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      {new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </button>
                  ))}
                </div>

                {activeDate && (
                  <h3 className='screening-date-heading'>
                    {new Date(`${activeDate}T12:00:00`).toLocaleDateString('sv-SE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>
                )}

                {screeningsLoading && (
                  <p className='text-secondary'>Laddar visningstider...</p>
                )}

                {screeningsError && (
                  <div className='alert alert-danger' role='alert'>
                    Kunde inte ladda visningstider: {screeningsError}
                    <button
                      type='button'
                      className='btn btn-outline-danger btn-sm ms-3'
                      onClick={refetchScreenings}>
                      Försök igen
                    </button>
                  </div>
                )}

                {!screeningsLoading &&
                  !screeningsError &&
                  (!screenings || screenings.length === 0) && (
                    <p className='text-secondary'>
                      Det finns inga kommande visningar för den här filmen.
                    </p>
                  )}

                {!screeningsLoading && selectedScreenings.length > 0 && (
                  <>
                    <div className='screening-list'>
                      {selectedScreenings.map((screening) => (
                        <div
                          key={screening.id}
                          className='screening-card'
                        >
                          <Link
                            to={getBookingUrl(screening.id)}
                            className='screening-card__link'
                          >
                            <div className='screening-card__time'>
                              <strong>
                                {new Date(screening.startsAt).toLocaleTimeString('sv-SE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </strong>

                              <span>
                                –{new Date(screening.endsAt).toLocaleTimeString('sv-SE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className='screening-card__details'>
                              <span>Salong {screening.cinema}</span>

                              <span
                                className={`screening-card__seats ${screening.availableSeats == null
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
                      Välj en tid ovan för att gå vidare till stolsäljaren.
                      Betalning sker i kassan.
                    </p>
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {
        movie.trailer_url && (
          <TrailerModal
            isOpen={isTrailerOpen}
            onClose={() => setSearchParams({}, { replace: true })}
            trailerUrl={movie.trailer_url}
            movieTitle={movie.title}
          />
        )
      }
    </div >
  )
}
