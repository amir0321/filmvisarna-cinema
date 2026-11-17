import { Link } from 'react-router'
import { useTranslation } from '../../context/LocaleContext'
import { translateGenre } from '../../i18n/mappers'
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
  const { t, locale } = useTranslation()
  const movieUrl = getMovieUrl(movie.id)

  return (
    <article className="movie-list-card">
      <Poster
        src={movie.poster_url}
        fallbackSrc={movie.landscape_image_url}
        alt=""
        title={movie.title}
        hoverZoom
        topLeftBadge={
          <>
            <span className="visually-hidden">{t('filter.ageLimit')} </span>
            <AgeBadge ageRating={movie.age_rating} variant="poster-filmer" />
          </>
        }
        topRightBadge={
          <Badge variant="runtime">
            <span aria-hidden="true">{formatDuration(movie.duration_minutes)}</span>
            <span className="visually-hidden">{t('movie.duration')} {formatDurationLong(movie.duration_minutes, locale)}</span>
          </Badge>
        }
      />

      <div className="movie-list-card__body">
        <StarRatingBadge rating={movie.imdb_rating} />

        <h2 className="movie-list-card__title">
          <Link to={movieUrl}>{movie.title}</Link>
        </h2>

        {movie.genres.length > 0 && (
          <ul className="movie-list-card__genres" aria-label={t('movie.genres')}>
            {movie.genres.map((genre) => (
              <li key={genre}>{translateGenre(genre, locale)}</li>
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
              {t('movies.premiereDate', { date: formatDateLong(toCinemaIsoDate(movie.release_date), locale) })}
            </p>
          )
        )}

        <Link to={movieUrl} className="btn btn-danger movie-list-card__button">
          {t(dayLabel ? 'movies.buyTickets' : 'movies.readMore')}
          <span className="visually-hidden"> {t('movies.forMovie', { title: movie.title })}</span>
        </Link>
      </div>
    </article>
  )
}

function ShowtimeLink({ screening }: { screening: Screening }) {
  const { t, locale } = useTranslation()
  const time = formatTime(screening.startsAt, locale)
  const seatsLeft = screening.availableSeats
  const isSoldOut = seatsLeft === 0
  const isLowOnSeats = !isSoldOut && seatsLeft !== undefined && seatsLeft <= LOW_SEATS_THRESHOLD
  const salong = t('movies.auditoriumNumber', { id: screening.cinemaId })

  if (isSoldOut) {
    return (
      <span className="movie-list-card__time movie-list-card__time--sold-out">
        {time} {salong} ({t('screening.soldOut')})
      </span>
    )
  }

  return (
    <Link
      to={getBookingUrl(screening.id)}
      className="movie-list-card__time"
      aria-label={isLowOnSeats && seatsLeft !== undefined ? t('movies.bookShowtimeLowAria', { time, cinema: screening.cinema, count: seatsLeft }) : t('movies.bookShowtimeAria', { time, cinema: screening.cinema })}
    >
      {time} {salong}
      {isLowOnSeats && seatsLeft !== undefined && <span className="movie-list-card__seats"> ({t('screening.seatsLeftShort', { count: seatsLeft })})</span>}
    </Link>
  )
}
