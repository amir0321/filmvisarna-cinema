import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Link } from "react-router";
import type { Movie } from "../../types";
import { formatDuration, formatDurationLong, getYouTubeBackgroundUrl } from "../../utils/movie";
import { getMovieTrailerUrl, getMovieUrl } from "../../utils/links";
import AgeBadge from "./AgeBadge";
import { loadYouTubeApi, type YouTubePlayer } from "../../utils/youtubeApi";
import { createPlaybackVisibilityTracker } from "../../utils/playbackVisibility";

const ROTATE_INTERVAL_MS = 15_000;

// The player owns its iframe inside this container, including Strict Mode cleanup.
function HeroBackgroundVideo({ src }: { src: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;
    let failed = false;
    let player: YouTubePlayer | null = null;
    let progressTimer: number | null = null;
    const visibility = createPlaybackVisibilityTracker();
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = '';
    iframe.tabIndex = -1;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.className = 'hero-section__video-frame';
    container.replaceChildren(iframe);

    function syncVisibility(target: YouTubePlayer, state?: number) {
      if (!active || failed) return;
      setIsLoaded(visibility.update(state ?? target.getPlayerState(), target.getCurrentTime(), performance.now()));
    }

    function hideFailedPlayer() {
      if (!active) return;
      failed = true;
      if (progressTimer !== null) window.clearInterval(progressTimer);
      setIsLoaded(false);
    }

    loadYouTubeApi().then((api) => {
      if (!active) return;
      player = new api.Player(iframe, {
        events: {
          onReady: ({ target }) => {
            if (!active || failed) return;
            target.mute();
            target.playVideo();
            syncVisibility(target);
            progressTimer = window.setInterval(() => syncVisibility(target), 200);
          },
          onStateChange: ({ target, data }) => syncVisibility(target, data),
          onError: hideFailedPlayer,
          onAutoplayBlocked: hideFailedPlayer,
        },
      });
    }).catch(hideFailedPlayer);

    return () => {
      active = false;
      if (progressTimer !== null) window.clearInterval(progressTimer);
      player?.destroy();
      container.replaceChildren();
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`hero-section__video${isLoaded ? " is-loaded" : ""}`}
    />
  );
}

interface HeroSectionProps {
  movies: Movie[];
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function HeroBackdrop({ movie, active, priority }: { movie: Movie; active: boolean; priority: boolean }) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const src = [movie.landscape_image_url, movie.poster_url].find((source) => source && !failedSources.includes(source));
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={`hero-section__image${active ? " is-active" : ""}`}
      fetchPriority={priority ? "high" : "low"}
      onError={() => setFailedSources((sources) => [...sources, src])}
    />
  );
}

export default function HeroSection({ movies }: HeroSectionProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(prefersReducedMotion);
  const [isHovered, setIsHovered] = useState(false);
  const [hasKeyboardFocus, setHasKeyboardFocus] = useState(false);

  const movie = movies[index % movies.length];
  const hasMultiple = movies.length > 1;
  const isRotating = hasMultiple && !isPaused && !isHovered && !hasKeyboardFocus;
  // The pause button stops the trailer too
  const videoUrl = !isPaused && movie.trailer_url ? getYouTubeBackgroundUrl(movie.trailer_url, window.location.origin) : null;

  // Restarts on every slide change, so manual navigation also resets the timer
  useEffect(() => {
    if (!isRotating) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % movies.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, isRotating, movies.length]);

  function showMovie(nextIndex: number) {
    setIndex((nextIndex + movies.length) % movies.length);
  }

  function handleFocus(event: FocusEvent<HTMLElement>) {
    if (event.target.matches(":focus-visible")) setHasKeyboardFocus(true);
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setHasKeyboardFocus(false);
  }

  return (
    <section
      className="hero-section"
      aria-roledescription="karusell"
      aria-label="Utvalda filmer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {movies.map((slide, slideIndex) => {
        return (
          <HeroBackdrop
            key={`${slide.id}:${slide.landscape_image_url}:${slide.poster_url}`}
            movie={slide}
            active={slideIndex === index}
            priority={slideIndex === 0}
          />
        );
      })}

      {videoUrl && (
        <HeroBackgroundVideo
          key={`${movie.id}:${videoUrl}`}
          src={videoUrl}
        />
      )}

      <div className="hero-section__content container-fluid">
        <div
          key={movie.id}
          className="hero-section__text"
          role="group"
          aria-roledescription="bild"
          aria-label={`${index + 1} av ${movies.length}`}
          aria-live={isRotating ? "off" : "polite"}
        >
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

          <h1 className="hero-section__title mb-3">{movie.title}</h1>

          {movie.description && (
            <p className="hero-section__description mb-4">{movie.description}</p>
          )}

          <div className="d-flex flex-wrap gap-3">
            {movie.trailer_url && (
              <Link
                to={getMovieTrailerUrl(movie.id)}
                className="btn hero-section__button btn-hero-secondary"
                aria-label={`Se trailer för ${movie.title}`}
              >
                <i className="bi bi-play-fill me-2" aria-hidden="true"></i>
                Se Trailer
              </Link>
            )}
            <Link
              to={getMovieUrl(movie.id)}
              className="btn hero-section__button btn-hero-primary"
              aria-label={`Boka biljett till ${movie.title}`}
            >
              Boka Biljett
              <i className="bi bi-chevron-right ms-2" aria-hidden="true"></i>
            </Link>
          </div>
        </div>

        {hasMultiple && (
          <div className="hero-carousel__controls">
            <button
              type="button"
              className="hero-carousel__arrow hero-carousel__arrow--prev"
              aria-label="Föregående film"
              onClick={() => showMovie(index - 1)}
            >
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </button>

            <div className="hero-carousel__bottom">
              <button
                type="button"
                className="hero-carousel__pause"
                aria-label={isPaused ? "Starta bildspel och trailer" : "Pausa bildspel och trailer"}
                onClick={() => setIsPaused((paused) => !paused)}
              >
                <i className={`bi ${isPaused ? "bi-play-fill" : "bi-pause-fill"}`} aria-hidden="true"></i>
              </button>
              {movies.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`hero-carousel__dot${slideIndex === index ? " is-active" : ""}`}
                  aria-label={`Visa ${slide.title}`}
                  aria-current={slideIndex === index}
                  onClick={() => showMovie(slideIndex)}
                ></button>
              ))}
            </div>

            <button
              type="button"
              className="hero-carousel__arrow hero-carousel__arrow--next"
              aria-label="Nästa film"
              onClick={() => showMovie(index + 1)}
            >
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroSectionSkeleton() {
  return (
    <section className="hero-section" aria-busy="true" aria-label="Laddar utvalda filmer">
      <div className="hero-section__content container-fluid">
        <div className="hero-section__text placeholder-glow" aria-hidden="true">
          <span className="placeholder col-4 mb-3 rounded"></span>
          <span className="placeholder col-10 placeholder-lg mb-2 rounded"></span>
          <span className="placeholder col-7 placeholder-lg mb-4 rounded"></span>
          <span className="placeholder col-12 mb-1 rounded"></span>
          <span className="placeholder col-9 mb-4 rounded"></span>
        </div>
      </div>
    </section>
  );
}
