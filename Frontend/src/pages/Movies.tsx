import { useMovies } from '../hooks'

function getAgeBadge(ageRating: string) {
  const age = Number(ageRating)
  if (Number.isNaN(age) || age === 0) return { className: 'age-badge-all', label: 'Alla' }
  if (age >= 15) return { className: 'age-badge-high', label: `${age} år` }
  return { className: 'age-badge-mid', label: `${age} år` }
}

export default function Movies() {
  const { data: movies, loading, error } = useMovies()
  const movieList = movies || []

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Aktuella filmer</h2>
          <p className="text-secondary mb-0">Här visas alla filmer som går på bio just nu.</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Laddar...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && movieList.length === 0 && (
        <div className="alert alert-info" role="alert">
          Inga filmer hittades.
        </div>
      )}

      <div className="row g-4">
        {movieList.map((movie) => {
          const duration = movie.duration_minutes ?? movie.duration
          const genre = movie.genres?.[0] || 'Långfilm'
          return (
            <div key={movie.id} className="col-12 col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 bg-card text-light overflow-hidden">
                {movie.poster_url && (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="card-img-top poster-img"
                  />
                )}
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-danger align-self-start">{genre}</span>
                    {movie.age_rating && (
                      <span className={`age-badge ${getAgeBadge(movie.age_rating).className}`}>
                        {getAgeBadge(movie.age_rating).label}
                      </span>
                    )}
                  </div>
                  <h5 className="card-title fw-bold text-white mb-2">{movie.title}</h5>
                  {duration && (
                    <p className="text-secondary small mb-3">
                      <i className="bi bi-clock me-1"></i> {duration} minuter
                    </p>
                  )}
                  <div className="mt-auto">
                    <button className="btn btn-outline-danger w-100 btn-sm">
                      Boka biljetter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
