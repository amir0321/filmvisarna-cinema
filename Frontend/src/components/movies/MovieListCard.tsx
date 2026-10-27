import { Link } from 'react-router'
import type { Movie, Screening } from '../../types'
import { AgeBadge, Badge, StarRatingBadge } from '../Badge'
import { Poster } from '../Poster'
import { formatDateLong, formatTime, toCinemaIsoDate } from '../../utils/date'
import { formatDuration, formatDurationLong } from '../../utils/movie'
import { getBookingUrl, getMovieUrl } from '../../utils/links'

const LOW_SEATS_THRESHOLD = 10

interface MovieListCardProps {
  movie: Movie
  screenings: Screening[]
  dayLabel: string | null
}

export default function MovieListCard({ movie, screenings, dayLabel }: MovieListCardProps) {
  const movieUrl = getMovieUrl(movie.id)

  return (
    <article className="movie-list-card">
      <Poster
        src={movie.poster_url}
        alt=""
        title={movie.title}
        hoverZoom
        topLeftBadge={
          <>
            <span className="visually-hidden">Åldersgräns </span>
            <AgeBadge ageRating={movie.age_rating} variant="poster-filmer" />
          </>
        }
        topRightBadge={
          <Badge variant="runtime">
            <span aria-hidden="true">{formatDuration(movie.duration_minutes)}</span>
            <span className="visually-hidden">Speltid {formatDurationLong(movie.duration_minutes)}</span>
          </Badge>
        }
      />

      <div className="movie-list-card__body">
        <StarRatingBadge rating={movie.imdb_rating} />

        <h2 className="movie-list-card__title">
          <Link to={movieUrl}>{movie.title}</Link>
        </h2>

        {movie.genres.length > 0 && (
          <ul className="movie-list-card__genres" aria-label="Genrer">
            {movie.genres.map((genre) => (
              <li key={genre}>{genre}</li>
            ))}
          </ul>
        )}

        {dayLabel ? (
          <div className="movie-list-card__showtimes">
            <p id={`showtimes-${movie.id}`} className="movie-list-card__day">
              {dayLabel}
            </p>
            <ul aria-labelledby={`showtimes-${movie.id}`}>
              {screenings.map((screening) => (
                <li key={screening.id}>
                  <ShowtimeLink screening={screening} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          movie.release_date && (
            <p className="movie-list-card__premiere">
              Premiär {formatDateLong(toCinemaIsoDate(movie.release_date))}
            </p>
          )
        )}

        <Link to={movieUrl} className="btn btn-danger movie-list-card__button">
          {dayLabel ? 'Köp biljetter' : 'Läs mer'}
          <span className="visually-hidden"> till {movie.title}</span>
        </Link>
      </div>
    </article>
  )
}

function ShowtimeLink({ screening }: { screening: Screening }) {
  const time = formatTime(screening.startsAt)
  const seatsLeft = screening.availableSeats
  const isSoldOut = seatsLeft === 0
  const isLowOnSeats = !isSoldOut && seatsLeft !== undefined && seatsLeft <= LOW_SEATS_THRESHOLD
  const salong = `Salong ${screening.cinemaId}`

  if (isSoldOut) {
    return (
      <span className="movie-list-card__time movie-list-card__time--sold-out">
        {time} {salong} (Fullbokad)
      </span>
    )
  }

  return (
    <Link
      to={getBookingUrl(screening.id)}
      className="movie-list-card__time"
      aria-label={`Boka ${time} i ${screening.cinema}${isLowOnSeats ? `, ${seatsLeft} platser kvar` : ''}`}
    >
      {time} {salong}
      {isLowOnSeats && <span className="movie-list-card__seats"> ({seatsLeft} kvar)</span>}
    </Link>
  )
}
