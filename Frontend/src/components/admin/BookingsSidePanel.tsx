import { useTranslation } from '../../context/LocaleContext'
import { formatSek } from '../../utils/price'
import type { AdminStats } from '../../api/adminBookings'
import type { ScreeningSeatStatus } from '../../types'

function MiniSeatMap({ seats, pendingSeatIds }: { seats: ScreeningSeatStatus[]; pendingSeatIds: number[] }) {
  const { t } = useTranslation()
  const pending = new Set(pendingSeatIds)
  const rows = [...new Set(seats.map((seat) => seat.row_label))].sort()
  const stateOf = (seat: ScreeningSeatStatus) =>
    seat.status === 'available' ? 'free' : pending.has(seat.id) ? 'pending' : 'booked'
  const legend = [
    ['free', 'admin.bookings.side.legendFree'],
    ['booked', 'admin.bookings.side.legendBooked'],
    ['pending', 'admin.bookings.side.legendPending'],
  ] as const

  return (
    <div className="fv-minimap-admin">
      <div className="fv-minimap-admin__rows" role="img" aria-label={t('admin.bookings.side.mapTitle')}>
        {rows.map((row) => (
          <div key={row} className="fv-minimap-admin__row">
            {seats
              .filter((seat) => seat.row_label === row)
              .sort((a, b) => a.seat_number - b.seat_number)
              .map((seat) => (
                <span key={seat.id} className={`fv-minimap-admin__seat fv-minimap-admin__seat--${stateOf(seat)}`} />
              ))}
          </div>
        ))}
      </div>
      <ul className="fv-minimap-admin__legend">
        {legend.map(([state, key]) => (
          <li key={state}>
            <span className={`fv-minimap-admin__seat fv-minimap-admin__seat--${state}`} aria-hidden="true" />
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  )
}
interface BookingsSidePanelProps {
   stats: AdminStats | null
   seats: ScreeningSeatStatus[] | null
   pendingSeatIds: number[]
   subtitle: string | null
   seatsError: boolean
 }
export default function BookingsSidePanel({ stats, seats, pendingSeatIds, subtitle, seatsError }: BookingsSidePanelProps) {
  const { t, locale } = useTranslation()
  if (!stats) return null

  const seatTotal = seats ? seats.length : stats.totalSeatsToday
  const seatBooked = seats
    ? seats.filter((seat) => seat.status !== 'available').length
    : stats.bookedSeatsToday
  const percent = seats
    ? seatTotal > 0 ? Math.round((seatBooked / seatTotal) * 100) : 0
    : Math.min(100, Math.max(0, stats.occupancyRatePercent))
  const tone = percent > 80 ? 'danger' : percent > 50 ? 'warning' : 'success'
  const free = seatTotal - seatBooked
  const remaining = stats.expectedRevenue - stats.paidRevenue

  return (
    <aside className="fv-side">
      <section className="fv-side__card" aria-labelledby="fv-side-map">
        <h2 id="fv-side-map" className="fv-side__heading">{t('admin.bookings.side.mapTitle')}</h2>
        {subtitle && <p className="fv-side__muted">{subtitle}</p>}
        {seatsError ? (
          <p className="fv-side__muted">{t('admin.bookings.side.mapError')}</p>
        ) : seats ? (
          <MiniSeatMap seats={seats} pendingSeatIds={pendingSeatIds} />
        ) : (
          <p className="fv-side__muted">{t('admin.bookings.side.mapEmpty')}</p>
        )}

        {!seatsError && (
          <div className="fv-side__occupancy">
            <div className="fv-side__row">
              <h3 id="fv-side-occupancy" className="fv-side__heading">{t('admin.bookings.side.occupancy')}</h3>
              <strong>{percent}%</strong>
            </div>
            <div
              className="fv-progress"
              role="progressbar"
              aria-labelledby="fv-side-occupancy"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div className={`fv-progress__bar fv-progress__bar--${tone}`} style={{ width: `${percent}%` }} />
            </div>
            <p className="fv-side__muted">
              {t('admin.bookings.side.occupancyDetail', { sold: seatBooked, free })}
            </p>
          </div>
        )}
      </section>

      <section className="fv-side__card" aria-labelledby="fv-side-cash">
        <h2 id="fv-side-cash" className="fv-side__heading">{t('admin.bookings.side.cashTitle')}</h2>
        <dl className="fv-side__list">
          <div className="fv-side__row">
            <dt>{t('admin.bookings.side.remaining')}</dt>
            <dd className="fv-side__value fv-side__value--warning">{formatSek(remaining, locale)}</dd>
          </div>
          <div className="fv-side__row">
            <dt>{t('admin.bookings.side.paid')}</dt>
            <dd className="fv-side__value fv-side__value--success">{formatSek(stats.paidRevenue, locale)}</dd>
          </div>
          <div className="fv-side__row">
            <dt>{t('admin.bookings.side.total')}</dt>
            <dd className="fv-side__value">{formatSek(stats.expectedRevenue, locale)}</dd>
          </div>
        </dl>
      </section>
    </aside>
  )
}