import { Link } from 'react-router'
import type { Movie, Screening } from '../../types'
import { formatShowtimeDayLabel, formatTime, toCinemaIsoDate } from '../../utils/date'
import { formatDuration, formatDurationLong } from '../../utils/movie'
import AgeBadge from './AgeBadge'

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
  const movieUrl = `/movies/${movie.id}`
  const image = movie.poster_url ?? movie.landscape_image_url

  return (
    <article className="movie-card h-100">
      {/* Hidden from keyboard and screen readers since the title already links to the movie */}
      <Link to={movieUrl} className="movie-card__image-link" tabIndex={-1} aria-hidden="true">
        {image ? (
          <img src={image} alt="" className="movie-card__image" loading="lazy" />
        ) : (
          <div className="movie-card__image movie-card__image--empty">
            <i className="bi bi-film"></i>
          </div>
        )}
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
          <span className="visually-hidden">Speltid: {formatDurationLong(movie.duration_minutes)}</span>
          {movie.director && (
            <>
              <span className="mx-2" aria-hidden="true">·</span>
              <span className="visually-hidden">, regi: </span>
              {movie.director}
            </>
          )}
        </p>

        {movie.genres.length > 0 && (
          <ul className="list-unstyled d-flex flex-wrap gap-1 mb-3" aria-label="Genrer">
            {movie.genres.map((genre) => (
              <li key={genre} className="movie-card__genre">
                {genre}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto d-flex flex-column gap-3">
          {groupScreeningsByDay(screenings).map(([date, dayScreenings]) => {
            const dayLabel = formatShowtimeDayLabel(date)
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
  const time = formatTime(screening.startsAt)
  const seatsLeft = screening.availableSeats
  const isSoldOut = seatsLeft === 0
  const isLowOnSeats = !isSoldOut && seatsLeft !== undefined && seatsLeft <= LOW_SEATS_THRESHOLD
  const label = `${dayLabel.toLowerCase()} ${time} i ${screening.cinema}`

  if (isSoldOut) {
    return (
      <span className="showtime-pill showtime-pill--sold-out" aria-label={`${label}, fullbokad`}>
        {time} · {shortCinemaName(screening.cinema)}
        <span className="showtime-pill__seats"> (Fullbokad)</span>
      </span>
    )
  }

  return (
    <Link
      to={`/booking/${screening.id}`}
      className="showtime-pill"
      aria-label={`Boka ${label}${isLowOnSeats ? `, ${seatsLeft} platser kvar` : ''}`}
    >
      {time} · {shortCinemaName(screening.cinema)}
      {isLowOnSeats && <span className="showtime-pill__seats"> ({seatsLeft} kvar)</span>}
    </Link>
  )
}
