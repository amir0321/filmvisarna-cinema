import { Link } from 'react-router'
import { useTranslation } from '../../context/LocaleContext'
import { translateGenre } from '../../i18n/mappers'
import type { Movie, Screening } from '../../types'
import { formatShowtimeDayLabel, formatTime, toCinemaIsoDate } from '../../utils/date'
import { formatDuration, formatDurationLong } from '../../utils/movie'
import { getBookingUrl, getMovieUrl } from '../../utils/links'
import AgeBadge from './AgeBadge'
import { Poster } from '../Poster'

interface MovieCardProps {
  movie: Movie
  screenings: Screening[]
}

const LOW_SEATS_THRESHOLD = 10

// "Stora Salongen" -> "Stora"
function shortCinemaName(cinema: string): string {
  return cinema.replace(/\s*salongen$/i, '') || cinema
}

function groupScreeningsByDay(screenings: Screening[]) {
  const groups = new Map<string, Screening[]>()
  for (const screening of screenings) {
    const date = toCinemaIsoDate(screening.startsAt)
    const dayScreenings = groups.get(date) ?? []
    dayScreenings.push(screening)
    groups.set(date, dayScreenings)
  }
  return [...groups.entries()]
}

export default function MovieCard({ movie, screenings }: MovieCardProps) {
  const { t, locale } = useTranslation()
  const movieUrl = getMovieUrl(movie.id)
  const image = movie.poster_url ?? movie.landscape_image_url

  return (
    <article className="movie-card h-100">
      {/* The title is the keyboard tab target; the poster link remains named and exposed to assistive technology. */}
      <Link to={movieUrl} className="movie-card__image-link" tabIndex={-1} aria-label={movie.title}>
        <Poster src={image} fallbackSrc={movie.landscape_image_url} alt="" title={movie.title} className="movie-card__poster" sizes="(min-width: 1200px) 280px, (min-width: 992px) 300px, (min-width: 576px) 45vw, 90vw" />
      </Link>

      <AgeBadge ageRating={movie.age_rating} className="movie-card__age" />

      <div className="movie-card__body">
        <h3 className="movie-card__title mb-1">
          <Link to={movieUrl} className="movie-card__title-link">
            {movie.title}
          </Link>
        </h3>

        <p className="movie-card__meta mb-2">
          <span aria-hidden="true">{formatDuration(movie.duration_minutes)}</span>
          <span className="visually-hidden">{t('movie.durationAnnouncement', { duration: formatDurationLong(movie.duration_minutes, locale) })}</span>
          {movie.director && (
            <>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="visually-hidden">{t('movie.directorInMeta')} </span>
              {movie.director}
            </>
          )}
        </p>

        {movie.genres.length > 0 && (
          <ul className="list-unstyled d-flex flex-wrap gap-1 mb-3" aria-label={t('movie.genres')}>
            {movie.genres.map((genre) => (
              <li key={genre} className="movie-card__genre">
                {translateGenre(genre, locale)}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto d-flex flex-column gap-3">
          {groupScreeningsByDay(screenings).map(([date, dayScreenings]) => {
            const dayLabel = formatShowtimeDayLabel(date, locale)
            const labelId = `showtimes-${movie.id}-${date}`
            return (
              <div key={date}>
                <p id={labelId} className="movie-card__day-label mb-2">
                  {dayLabel}
                </p>
                <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0" aria-labelledby={labelId}>
                  {dayScreenings.map((screening) => (
                    <li key={screening.id}>
                      <ShowtimePill screening={screening} dayLabel={dayLabel} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

interface ShowtimePillProps {
  screening: Screening
  dayLabel: string
}

function ShowtimePill({ screening, dayLabel }: ShowtimePillProps) {
  const { t, locale } = useTranslation()
  const time = formatTime(screening.startsAt, locale)
  const seatsLeft = screening.availableSeats
  const isSoldOut = seatsLeft === 0
  const isLowOnSeats = !isSoldOut && seatsLeft !== undefined && seatsLeft <= LOW_SEATS_THRESHOLD
  const label = t('home.showtimeLabel', { day: dayLabel.toLowerCase(), time, cinema: screening.cinema })

  if (isSoldOut) {
    return (
      <span className="showtime-pill showtime-pill--sold-out" aria-label={t('home.showtimeSoldOutAria', { label })}>
        {time} · {shortCinemaName(screening.cinema)}
        <span className="showtime-pill__seats"> ({t('screening.soldOut')})</span>
      </span>
    )
  }

  return (
    <Link
      to={getBookingUrl(screening.id)}
      className="showtime-pill"
      aria-label={isLowOnSeats && seatsLeft !== undefined ? t('home.bookShowtimeLowAria', { label, count: seatsLeft }) : t('home.bookShowtimeAria', { label })}
    >
      {time} · {shortCinemaName(screening.cinema)}
      {isLowOnSeats && seatsLeft !== undefined && <span className="showtime-pill__seats"> ({t('screening.seatsLeftShort', { count: seatsLeft })})</span>}
    </Link>
  )
}
