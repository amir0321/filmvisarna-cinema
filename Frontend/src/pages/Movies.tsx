import { useEffect, useState } from 'react'

export const navTitle = 'Movies'
export const navOrder = 2

interface Movie {
  id: number
  title: string
  genre: string | null
  duration: number | null
  created_at: string
}

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/movies')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch movies')
        }
        return res.json()
      })
      .then((data: Movie[]) => {
        setMovies(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError('Could not load movies from server.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Current Movies</h2>
          <p className="text-secondary mb-0">Here are all movies currently showing.</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && movies.length === 0 && (
        <div className="alert alert-info" role="alert">
          No movies found.
        </div>
      )}

      <div className="row g-4">
        {movies.map((movie) => (
          <div key={movie.id} className="col-12 col-md-6 col-lg-3">
            <div className="card h-100 shadow-sm border-0 bg-dark text-light">
              <div className="card-body d-flex flex-column">
                <span className="badge bg-danger align-self-start mb-2">
                  {movie.genre || 'Feature Film'}
                </span>
                <h5 className="card-title fw-bold text-white mb-2">{movie.title}</h5>
                {movie.duration && (
                  <p className="text-secondary small mb-3">
                    ⏱ {movie.duration} minutes
                  </p>
                )}
                <div className="mt-auto">
                  <button className="btn btn-outline-danger w-100 btn-sm">
                    Book Tickets
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
