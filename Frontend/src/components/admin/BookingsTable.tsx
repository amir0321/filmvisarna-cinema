import { useTranslation } from '../../context/LocaleContext'
import { getIntlLocale } from '../../utils/locale'
import type { Booking, TicketItem } from '../../types/booking'

function seatsByRow(tickets: TicketItem[]) {
  const rows = new Map<string, number[]>()
  for (const ticket of tickets) {
    if (!ticket.row || ticket.seatNumber == null) continue
    rows.set(ticket.row, [...(rows.get(ticket.row) ?? []), ticket.seatNumber])
  }
  return [...rows].map(([row, numbers]) => ({ row, seats: numbers.sort((a, b) => a - b).join(', ') }))
}

function ticketTypes(tickets: TicketItem[]) {
  const counts = new Map<string, number>()
  for (const ticket of tickets) {
    const type = ticket.type ?? ''
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  return [...counts].map(([type, count]) => `${count}x ${type}`).join(', ')
}
interface BookingsTableProps{
  bookings: Booking[]
  payingId: number | null
  onPay: (booking: Booking) => void
  onCancel: (booking: Booking) => void
}
export default function BookingsTable({ bookings, payingId, onPay, onCancel }: BookingsTableProps) {
  const { t, locale } = useTranslation()
  const nf = new Intl.NumberFormat(getIntlLocale(locale))
  const dateTime = new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Stockholm',
  })

  return (
    <div className="fv-bookings-table">
      <table>
        <thead>
          <tr>
            <th scope="col">{t('admin.bookings.table.ref')}</th>
            <th scope="col">{t('admin.bookings.table.customer')}</th>
            <th scope="col">{t('admin.bookings.table.movie')}</th>
            <th scope="col">{t('admin.bookings.table.auditorium')}</th>
            <th scope="col">{t('admin.bookings.table.seats')}</th>
            <th scope="col">{t('admin.bookings.table.amount')}</th>
            <th scope="col">{t('admin.bookings.table.action')}</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const statusKey = booking.status === 'confirmed' ? 'paid' : booking.status
            return (
              <tr key={booking.id}>
                <td><span className="fv-ref">{booking.bookingRef}</span></td>
                <td>{booking.email}</td>
                <td>
                  <div>{booking.movieTitle}</div>
                  {booking.screeningStartsAt && (
                    <div className="fv-bookings-table__muted">{dateTime.format(new Date(booking.screeningStartsAt))}</div>
                  )}
                </td>
                <td>{booking.cinemaName}</td>
                <td>
                  {seatsByRow(booking.tickets).map(({ row, seats }) => (
                    <div key={row}>{t('admin.bookings.table.seatsRow', { row, seats })}</div>
                  ))}
                  <div className="fv-bookings-table__muted">{ticketTypes(booking.tickets)}</div>
                  {booking.items && booking.items.length > 0 && (
                    <span className="fv-badge fv-badge--kiosk">{t('admin.bookings.table.kiosk')}</span>
                  )}
                </td>
                <td>
                  <div>{nf.format(booking.totalPrice)} kr</div>
                  <span className={`fv-badge fv-badge--${statusKey}`}>{t(`admin.bookings.status.${statusKey}`)}</span>
                  {booking.isCheckedIn && (
                    <span className="fv-badge fv-badge--checkedIn">{t('admin.bookings.status.checkedIn')}</span>
                  )}
                </td>
                <td>
                 {booking.status === 'confirmed' ? (
                   <span className="fv-bookings-table__paid">{t('admin.bookings.action.paid')}</span>
                 ) : booking.status !== 'cancelled' ? (
                    <button
                     type="button"
                     className="btn btn-sm btn-outline-success"
                     disabled={payingId !== null}
                     onClick={() => onPay(booking)}
                   >
                     {t('admin.bookings.action.markPaid')}
                   </button>
                 ) : null}
               </td>
                               <td>
                  <div className="fv-bookings-table__actions">
                    {booking.status === 'confirmed' ? (
                      <span className="fv-bookings-table__paid">{t('admin.bookings.action.paid')}</span>
                    ) : booking.status !== 'cancelled' ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        disabled={payingId !== null}
                        onClick={() => onPay(booking)}
                      >
                        {t('admin.bookings.action.markPaid')}
                      </button>
                    ) : null}
                    {booking.status !== 'cancelled' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onCancel(booking)}
                      >
                        {t('admin.bookings.action.cancel')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}