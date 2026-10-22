import { useState } from 'react'
import { Link } from 'react-router'
import type { Movie } from '../../types'
import { formatDuration, formatDurationLong } from '../../utils/movie'
import AgeBadge from './AgeBadge'
import TrailerModal from './TrailerModal'
import './HeroSection.scss'

interface HeroSectionProps {
  movie: Movie
}

export default function HeroSection({ movie }: HeroSectionProps) {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const backgroundImage = movie.landscape_image_url ?? movie.poster_url

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      {/* Decorative: the title is already given as text, so alt is intentionally empty */}
      {backgroundImage && (
        <img src={backgroundImage} alt="" className="hero-section__image" fetchPriority="high" />
      )}

      <div className="hero-section__content container-fluid px-3 px-md-5">
        <div className="hero-section__text">
          <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 mb-3">
            {movie.genres.map((genre) => (
              <span key={genre} className="badge rounded-pill hero-section__genre">
                {genre}
              </span>
            ))}
            <AgeBadge ageRating={movie.age_rating} />
            <span className="hero-section__duration">
              <span aria-hidden="true">{formatDuration(movie.duration_minutes)}</span>
              <span className="visually-hidden">
                Speltid: {formatDurationLong(movie.duration_minutes)}
              </span>
            </span>
          </div>

          <h1 id="hero-title" className="hero-section__title mb-3">
            {movie.title}
          </h1>

          {movie.description && (
            <p className="hero-section__description mb-4">{movie.description}</p>
          )}

          <div className="d-flex flex-wrap gap-3">
            {movie.trailer_url && (
              <button
                type="button"
                className="btn hero-section__button btn-hero-secondary"
                onClick={() => setIsTrailerOpen(true)}
              >
                <i className="bi bi-play-fill me-2" aria-hidden="true"></i>
                Se Trailer
              </button>
            )}
            <Link
              to={`/movies/${movie.id}`}
              className="btn hero-section__button btn-hero-primary"
              aria-label={`Boka biljett till ${movie.title}`}
            >
              Boka Biljett
              <i className="bi bi-chevron-right ms-2" aria-hidden="true"></i>
            </Link>
          </div>
        </div>
      </div>

      {movie.trailer_url && (
        <TrailerModal
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
          trailerUrl={movie.trailer_url}
          movieTitle={movie.title}
        />
      )}
    </section>
  )
}

// Placeholder shown while the featured movie is loading, same height as the hero to avoid layout shift.
export function HeroSectionSkeleton() {
  return (
    <section className="hero-section" aria-busy="true" aria-label="Laddar utvald film">
      <div className="hero-section__content container-fluid px-3 px-md-5">
        <div className="hero-section__text placeholder-glow" aria-hidden="true">
          <span className="placeholder col-4 mb-3 rounded"></span>
          <span className="placeholder col-10 placeholder-lg mb-2 rounded"></span>
          <span className="placeholder col-7 placeholder-lg mb-4 rounded"></span>
          <span className="placeholder col-12 mb-1 rounded"></span>
          <span className="placeholder col-9 mb-4 rounded"></span>
        </div>
      </div>
    </section>
  )
}
