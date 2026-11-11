import { useState, type FormEvent } from 'react'
import apiClient from '../../api/client'
import type { CinemaSummary, Movie, Screening } from '../../types'
import { Modal } from '../Modal'
import { InlineFeedback } from '../Toast'
import {
  addDaysToIsoDate,
  capitalize,
  formatShowtimeDayLabel,
  formatTime,
  toCinemaDateTime,
  toCinemaIsoDate,
  todayIsoDate,
} from '../../utils/date'
import { formatAgeRating, formatDuration } from '../../utils/movie'

// Same as SCREENING_BUFFER_MINUTES in the backend
const CLEANING_MINUTES = 20
const DAYS_AHEAD = 30

// Mount only while open so the form resets
interface ScreeningFormModalProps {
  // null = create a new screening
  screening: Screening | null
  movies: Movie[]
  cinemas: CinemaSummary[]
  onClose: () => void
  onSaved: (message: string) => void
}

interface FormValues {
  movieId: number | null
  cinemaId: number | null
  date: string
  time: string
}

function getInitialValues(screening: Screening | null): FormValues {
  if (!screening) {
    return { movieId: null, cinemaId: null, date: todayIsoDate(), time: '18:00' }
  }
  return {
    movieId: screening.movieId,
    cinemaId: screening.cinemaId,
    date: toCinemaIsoDate(screening.startsAt),
    time: formatTime(screening.startsAt),
  }
}

function getDateOptions(selectedDate: string): string[] {
  const today = todayIsoDate()
  const dates = Array.from({ length: DAYS_AHEAD }, (_, index) => addDaysToIsoDate(today, index))
  return dates.includes(selectedDate) ? dates : [selectedDate, ...dates]
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = (hours * 60 + mins + minutes) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// "Stora Salongen" -> "Salong 1 — Stora"
function getCinemaTitle(cinema: CinemaSummary): string {
  return `Salong ${cinema.id} — ${cinema.name.replace(/\s*salongen$/i, '')}`
}

export default function ScreeningFormModal({
  screening,
  movies,
  cinemas,
  onClose,
  onSaved,
}: ScreeningFormModalProps) {
  const [values, setValues] = useState(() => getInitialValues(screening))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = screening !== null
  // Booked screenings can't be moved
  const isLocked = isEditing && (screening.bookedSeats ?? 0) > 0
  const selectedMovie = movies.find((movie) => movie.id === values.movieId)
  const isComplete = values.movieId !== null && values.cinemaId !== null && values.time !== ''

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isComplete) return
    setError(null)
    setIsSaving(true)

    const body = {
      movieId: values.movieId,
      cinemaId: values.cinemaId,
      startsAt: toCinemaDateTime(values.date, values.time),
    }

    try {
      if (isEditing) {
        await apiClient.put(`/screenings/${screening.id}`, isLocked ? { movieId: body.movieId } : body)
        onSaved('Ändringarna har sparats.')
      } else {
        await apiClient.post('/screenings', body)
        onSaved('Visningen har schemalagts.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Det gick inte att spara visningen.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? 'Redigera visning' : 'Schemalägg ny visning'} size="md">
      <form className="screening-form" onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <InlineFeedback variant="danger" message={error} className="mb-3" />}
          {isLocked && (
            <InlineFeedback
              variant="info"
              message="Visningen har bokningar, så salong, datum och tid kan inte ändras."
              className="mb-3"
            />
          )}

          <fieldset className="screening-form__group">
            <legend className="screening-form__label">Välj film</legend>
            <div className="screening-form__movies">
              {movies.map((movie) => {
                const isSelected = movie.id === values.movieId
                return (
                  <label key={movie.id} className={`screening-option${isSelected ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="screening-movie"
                      className="visually-hidden"
                      checked={isSelected}
                      onChange={() => update('movieId', movie.id)}
                    />
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt="" className="screening-option__poster" loading="lazy" />
                    ) : (
                      <span className="screening-option__poster" aria-hidden="true"></span>
                    )}
                    <span className="screening-option__text">
                      <span className="screening-option__title">{movie.title}</span>
                      <span className="screening-option__meta">
                        {formatDuration(movie.duration_minutes)} · {formatAgeRating(movie.age_rating)}
                      </span>
                    </span>
                    {isSelected && <i className="bi bi-check-lg screening-option__check" aria-hidden="true"></i>}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="screening-form__group" disabled={isLocked}>
            <legend className="screening-form__label">Välj salong</legend>
            <div className="screening-form__cinemas">
              {cinemas.map((cinema) => {
                const isSelected = cinema.id === values.cinemaId
                return (
                  <label key={cinema.id} className={`screening-option${isSelected ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="screening-cinema"
                      className="visually-hidden"
                      checked={isSelected}
                      onChange={() => update('cinemaId', cinema.id)}
                    />
                    <span className="screening-option__text">
                      <span className="screening-option__title">{getCinemaTitle(cinema)}</span>
                      <span className="screening-option__meta">
                        {cinema.total_seats} platser{cinema.format ? `, ${cinema.format}` : ''}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="row g-3">
            <div className="col-6">
              <label htmlFor="screening-date" className="screening-form__label">
                Datum
              </label>
              <select
                id="screening-date"
                className="form-select screening-form__input"
                disabled={isLocked}
                value={values.date}
                onChange={(event) => update('date', event.target.value)}
              >
                {getDateOptions(values.date).map((date) => (
                  <option key={date} value={date}>
                    {capitalize(formatShowtimeDayLabel(date))}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label htmlFor="screening-time" className="screening-form__label">
                Starttid
              </label>
              <input
                id="screening-time"
                type="time"
                className="form-control screening-form__input screening-form__time"
                required
                disabled={isLocked}
                step={300}
                value={values.time}
                onChange={(event) => update('time', event.target.value)}
              />
            </div>
          </div>

          {selectedMovie && values.time && (
            <p className="screening-form__summary">
              <i className="bi bi-clock" aria-hidden="true"></i>
              Beräknad sluttid:{' '}
              <strong>
                {addMinutesToTime(values.time, selectedMovie.duration_minutes + CLEANING_MINUTES)}
              </strong>
              <small>(inkl. {CLEANING_MINUTES} min städning)</small>
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn screening-form__cancel" onClick={onClose} disabled={isSaving}>
            Avbryt
          </button>
          <button type="submit" className="btn btn-danger screening-form__submit" disabled={isSaving || !isComplete}>
            {isSaving ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            ) : (
              <i className={`bi ${isEditing ? 'bi-check-lg' : 'bi-plus-lg'} me-2`} aria-hidden="true"></i>
            )}
            {isEditing ? 'Spara ändringar' : 'Publicera visning'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
