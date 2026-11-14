import type { CinemaSummary } from '../../types/cinema'
import type { Screening } from '../../types/screening'
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

function ScreeningActions({ screening, onEdit, onCancel }: {
  screening: Screening
  onEdit: ScreeningsTableProps['onEdit']
  onCancel: ScreeningsTableProps['onCancel']
}) {
  const hasBookings = (screening.bookedSeats ?? 0) > 0
  return (
    <div className="admin-screening-actions">
      <div className="admin-screening-actions__buttons">
        <button type="button" className="btn btn-sm admin-table__edit" onClick={() => onEdit(screening)}
          aria-label={`Redigera ${screening.movieTitle} ${formatTime(screening.startsAt)}`}>
          <i className="bi bi-pencil-fill me-1" aria-hidden="true" />Redigera
        </button>
        {hasBookings ? (
          <button type="button" className="btn btn-outline-danger btn-sm" disabled>
            Ställ in<span className="visually-hidden"> (har bokningar)</span>
          </button>
        ) : <InlineConfirmAction label="Ställ in" confirmLabel="Ja, ställ in" cancelLabel="Avbryt" onConfirm={() => onCancel(screening)} />}
      </div>
      {hasBookings ? <p className="admin-screening-actions__reason">Visningen har bokningar och kan inte ställas in.</p> : null}
    </div>
  )
}

function SoldSeats({ sold, total }: { sold: number; total: number }) {
  const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((sold / total) * 100))) : 0
  return (
    <div className="admin-table__sold">
      <span>{sold} / {total}</span>
      <div className={`admin-table__bar${percent >= 90 ? ' is-almost-full' : ''}`} aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ScreeningStatus({ sold, total }: { sold: number; total: number }) {
  return total > 0 && sold >= total ? <Badge variant="warning">Fullbokad</Badge> : <StatusBadge status="active" />
}

export default function ScreeningsTable({ screenings, cinemas, onEdit, onCancel }: ScreeningsTableProps) {
  return (
    <>
    <div className="admin-table-card admin-screenings-table d-none d-xl-block">
      <div className="table-responsive">
        <table className="admin-table">
          <caption className="visually-hidden">Filmvisningar med datum, tider, salong, bokade platser och åtgärder.</caption>
          <colgroup>
            <col className="admin-screenings-table__date" /><col className="admin-screenings-table__time" />
            <col className="admin-screenings-table__cinema" /><col />
            <col className="admin-screenings-table__format" /><col className="admin-screenings-table__seats" />
            <col className="admin-screenings-table__time" /><col className="admin-screenings-table__status" />
            <col className="admin-screenings-table__actions" />
          </colgroup>
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

              return (
                <tr key={screening.id}>
                  <td>{formatDayLabel(screening.startsAt)}</td>
                  <td className="admin-table__time">{formatTime(screening.startsAt)}</td>
                  <td>
                    <AuditoriumBadge auditorium={`Salong ${screening.cinemaId}`} />
                  </td>
                  <th scope="row" className="admin-table__title admin-screenings-table__title">
                    {screening.movieTitle}
                  </th>
                  <td>
                    <span className="admin-table__format">{getFormat(cinema)}</span>
                  </td>
                  <td>
                    <SoldSeats sold={sold} total={total} />
                  </td>
                  <td className="admin-table__time">{formatTime(screening.endsAt)}</td>
                  <td>
                    <ScreeningStatus sold={sold} total={total} />
                  </td>
                  <td>
                    <ScreeningActions screening={screening} onEdit={onEdit} onCancel={onCancel} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    <ul className="admin-screening-cards d-xl-none" aria-label="Filmvisningar">
      {screenings.map(screening => {
        const cinema = cinemas.find(item => item.id === screening.cinemaId)
        const sold = screening.bookedSeats ?? 0
        const total = screening.totalSeats ?? cinema?.total_seats ?? 0
        return (
          <li key={screening.id}>
            <article className="admin-screening-card" aria-label={`${screening.movieTitle}, ${formatDayLabel(screening.startsAt)} ${formatTime(screening.startsAt)}`}>
              <header>
                <span className="admin-screening-card__date">{formatDayLabel(screening.startsAt)}</span>
                <ScreeningStatus sold={sold} total={total} />
              </header>
              <h2>{screening.movieTitle}</h2>
              <dl className="admin-screening-card__details">
                <div><dt>Tid</dt><dd className="admin-table__time">{formatTime(screening.startsAt)}–{formatTime(screening.endsAt)}</dd></div>
                <div><dt>Salong</dt><dd>{screening.cinema || cinema?.name || `Salong ${screening.cinemaId}`}</dd></div>
                <div><dt>Format</dt><dd><span className="admin-table__format">{getFormat(cinema)}</span></dd></div>
                <div><dt>Sålda platser</dt><dd><SoldSeats sold={sold} total={total} /></dd></div>
              </dl>
              <ScreeningActions screening={screening} onEdit={onEdit} onCancel={onCancel} />
            </article>
          </li>
        )
      })}
    </ul>
    </>
  )
}
