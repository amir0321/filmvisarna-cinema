import { useMemo } from 'react'
import { useScreenings } from '../hooks/useScreenings'
import { useParams } from 'react-router'
import { useMovie } from '../hooks/useMovies'

export default function MovieDetails() {
  const { id } = useParams()
  const { data: movie, loading, error, refetch } = useMovie(id)
  const {
    data: screenings,
    loading: screeningsLoading,
    error: screeningsError,
    refetch: refetchScreenings,
  } = useScreenings({ movieId: Number(id) })

  const screeningsByDate = useMemo(() => {
    const groups = new Map<string, typeof screenings>()

    screenings?.forEach((screening) => {
      const date = new Date(screening.startsAt).toLocaleDateString('sv-SE')

      if (!groups.has(date)) {
        groups.set(date, [])
      }
      groups.get(date)!.push(screening)
    })

    return Array.from(groups.entries())
  }, [screenings])

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
    <div className='py-4'>
      <div className='row g-4'>
        <div className='col-12 col-md-4'>
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={`Affisch för ${movie.title}`}
              className='img-fluid rounded-4 shadow'
            />
          ) : (
            <div className='bg-card rounded-4 p-5 text-center'>
              Ingen affisch tillgänglig
            </div>
          )}

          <div className='card bg-card border-secondary rounded-4 mt-4'>
            <div className='card-body p-4'>
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
        </div>

        <div className='col-12 col-md-8'>
          <div className='d-flex flex-wrap gap-2 mb-3'>
            {movie.genres.map((genre) => (
              <span key={genre} className='badge bg-secondary'>
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

          <p className='fs-5'>
            {movie.description || 'Synopsis saknas.'}
          </p>

          <section className='mt-5'>
            <h2 className='h3 fw-bold mb-4'>Visningstider</h2>
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

            {!screeningsLoading && screenings && screenings.length > 0 && (
              <div className='d-flex flex-column gap-4'>
                {screeningsByDate.map(([date, dateScreenings]) => (
                  <section key={date}>
                    <h3 className='h4 fw-bold text-capitalize mb-3'>
                      {new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </h3>

                    <div className='d-flex flex-column gap-3'>
                      {dateScreenings?.map((screening) => (
                        <div
                          key={screening.id}
                          className='card bg-card border-secondary'>

                          <div className='card-body d-flex flex-wrap justify-content-between align-items-center gap-3'>
                            <div>
                              <p className='fw-bold mb-2'>
                                {new Date(screening.startsAt).toLocaleTimeString(
                                  'sv-SE',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </p>

                              <span className='badge bg-secondary'>
                                Salong: {screening.cinema}
                              </span>
                            </div>

                            <div className='d-flex align-items-center gap-3'>
                              <span className='text-secondary small'>
                                {screening.availableSeats ?? '-'} platser lediga
                              </span>

                              <button
                                type='button'
                                className='btn btn-danger'
                                disabled
                                title='Bokningsflödet kan kopplas in senare'>
                                Boka
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
