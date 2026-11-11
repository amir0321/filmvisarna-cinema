import type { CinemaSummary, Screening } from '../../types'
import { AuditoriumBadge, Badge, StatusBadge } from '../Badge'
import { InlineConfirmAction } from '../Toast'
import { addDaysToIsoDate, capitalize, formatDateShort, formatTime, toCinemaIsoDate, todayIsoDate } from '../../utils/date'

interface ScreeningsTableProps {
  screenings: Screening[]
  cinemas: CinemaSummary[]
  onEdit: (screening: Screening) => void
  onCancel: (screening: Screening) => Promise<void>
}

function formatDayLabel(isoDateTime: string): string {
  const date = toCinemaIsoDate(isoDateTime)
  const today = todayIsoDate()
  if (date === today) return 'Idag'
  if (date === addDaysToIsoDate(today, 1)) return 'Imorgon'
  return capitalize(formatDateShort(date))
}

// "4K Dolby Atmos" -> "4K"
function getFormat(cinema: CinemaSummary | undefined): string {
  return cinema?.format?.split(' ')[0] ?? '2D'
}

export default function ScreeningsTable({ screenings, cinemas, onEdit, onCancel }: ScreeningsTableProps) {
  return (
    <div className="admin-table-card">
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Datum</th>
              <th scope="col">Starttid</th>
              <th scope="col">Salong</th>
              <th scope="col">Film</th>
              <th scope="col">Format</th>
              <th scope="col">Sålda platser</th>
              <th scope="col">Sluttid</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody>
            {screenings.map((screening) => {
              const cinema = cinemas.find((item) => item.id === screening.cinemaId)
              const sold = screening.bookedSeats ?? 0
              const total = screening.totalSeats ?? cinema?.total_seats ?? 0
              const percent = total > 0 ? Math.round((sold / total) * 100) : 0
              const hasBookings = sold > 0
              const isSoldOut = total > 0 && sold >= total

              return (
                <tr key={screening.id}>
                  <td>{formatDayLabel(screening.startsAt)}</td>
                  <td className="admin-table__time">{formatTime(screening.startsAt)}</td>
                  <td>
                    <AuditoriumBadge auditorium={`Salong ${screening.cinemaId}`} />
                  </td>
                  <th scope="row" className="admin-table__title">
                    {screening.movieTitle}
                  </th>
                  <td>
                    <span className="admin-table__format">{getFormat(cinema)}</span>
                  </td>
                  <td>
                    <div className="admin-table__sold">
                      <span>
                        {sold} / {total}
                      </span>
                      <div
                        className={`admin-table__bar${percent >= 90 ? ' is-almost-full' : ''}`}
                        aria-hidden="true"
                      >
                        <span style={{ width: `${percent}%` }}></span>
                      </div>
                    </div>
                  </td>
                  <td className="admin-table__time">{formatTime(screening.endsAt)}</td>
                  <td>
                    {isSoldOut ? <Badge variant="warning">Fullbokad</Badge> : <StatusBadge status="active" />}
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="btn btn-sm admin-table__edit"
                        onClick={() => onEdit(screening)}
                        aria-label={`Redigera ${screening.movieTitle} ${formatTime(screening.startsAt)}`}
                      >
                        <i className="bi bi-pencil-fill me-1" aria-hidden="true"></i>
                        Redigera
                      </button>
                      {hasBookings ? (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          disabled
                          title="Visningen har bokningar och kan inte ställas in"
                        >
                          Ställ in
                          <span className="visually-hidden"> (har bokningar)</span>
                        </button>
                      ) : (
                        <InlineConfirmAction
                          label="Ställ in"
                          confirmLabel="Ja, ställ in"
                          cancelLabel="Avbryt"
                          onConfirm={() => onCancel(screening)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
