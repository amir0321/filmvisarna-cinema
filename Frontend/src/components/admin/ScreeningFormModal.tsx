import { useState, type FormEvent } from 'react'
import apiClient from '../../api/client'
import type { CinemaSummary, Movie, Screening } from '../../types'
import { Modal } from '../Modal'
import { InlineFeedback } from '../Toast'
import { addDaysToIsoDate, formatTime, toCinemaDateTime, toCinemaIsoDate, todayIsoDate } from '../../utils/date'
import { formatDuration } from '../../utils/movie'

// Mount only while open, so the form starts fresh each time
interface ScreeningFormModalProps {
  // null = create a new screening
  screening: Screening | null
  movies: Movie[]
  cinemas: CinemaSummary[]
  onClose: () => void
  onSaved: (message: string) => void
}

interface FormValues {
  movieId: string
  cinemaId: string
  date: string
  time: string
}

function getInitialValues(screening: Screening | null): FormValues {
  if (!screening) {
    return { movieId: '', cinemaId: '', date: addDaysToIsoDate(todayIsoDate(), 1), time: '18:00' }
  }
  return {
    movieId: String(screening.movieId),
    cinemaId: String(screening.cinemaId),
    date: toCinemaIsoDate(screening.startsAt),
    time: formatTime(screening.startsAt),
  }
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = (hours * 60 + mins + minutes) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
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
  // The backend doesn't allow moving a screening that already has bookings
  const isLocked = isEditing && (screening.bookedSeats ?? 0) > 0
  const selectedMovie = movies.find((movie) => String(movie.id) === values.movieId)

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSaving(true)

    const body = {
      movieId: Number(values.movieId),
      cinemaId: Number(values.cinemaId),
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
    <Modal
      isOpen
      onClose={onClose}
      title={isEditing ? 'Redigera visning' : 'Schemalägg ny visning'}
      size="md"
    >
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

          <div className="mb-3">
            <label htmlFor="screening-movie" className="form-label">
              Film
            </label>
            <select
              id="screening-movie"
              className="form-select"
              required
              value={values.movieId}
              onChange={(event) => update('movieId', event.target.value)}
            >
              <option value="" disabled>
                Välj film
              </option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="screening-cinema" className="form-label">
              Salong
            </label>
            <select
              id="screening-cinema"
              className="form-select"
              required
              disabled={isLocked}
              value={values.cinemaId}
              onChange={(event) => update('cinemaId', event.target.value)}
            >
              <option value="" disabled>
                Välj salong
              </option>
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name} ({cinema.total_seats} platser)
                </option>
              ))}
            </select>
          </div>

          <div className="row g-3">
            <div className="col-sm-6">
              <label htmlFor="screening-date" className="form-label">
                Datum
              </label>
              <input
                id="screening-date"
                type="date"
                className="form-control"
                required
                disabled={isLocked}
                min={todayIsoDate()}
                value={values.date}
                onChange={(event) => update('date', event.target.value)}
              />
            </div>
            <div className="col-sm-6">
              <label htmlFor="screening-time" className="form-label">
                Starttid
              </label>
              <input
                id="screening-time"
                type="time"
                className="form-control"
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
              <i className="bi bi-clock me-2" aria-hidden="true"></i>
              Slutar {addMinutesToTime(values.time, selectedMovie.duration_minutes)} · Speltid{' '}
              {formatDuration(selectedMovie.duration_minutes)}
            </p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-outline-light" onClick={onClose} disabled={isSaving}>
            Avbryt
          </button>
          <button type="submit" className="btn btn-danger fw-semibold" disabled={isSaving}>
            {isSaving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {isEditing ? 'Spara ändringar' : 'Schemalägg visning'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
