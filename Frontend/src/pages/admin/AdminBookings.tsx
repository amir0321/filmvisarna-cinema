import { useTranslation } from '../../context/LocaleContext'
import { useState, useCallback } from 'react'
import { getIntlLocale } from '../../utils/locale'
import { getAdminStats, type AdminStats, getAdminBookings, payBooking } from '../../api/adminBookings'
import { ApiError } from '../../api/client'
import { useFetch } from '../../hooks/useFetch'
import { useScreenings } from '../../hooks/useScreenings'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/EmptyState'
import QuickCheckIn from '../../components/admin/QuickCheckIn'
import BookingsTable from '../../components/admin/BookingsTable'
import type { Booking } from '../../types/booking'

export default function AdminBookings() {
  const { t, locale } = useTranslation()
  const { data: stats, error, refetch: refetchStats } = useFetch<AdminStats>((signal) => getAdminStats(signal))
  const nf = new Intl.NumberFormat(getIntlLocale(locale))
  const [screeningId, setScreeningId] = useState('')
  const { data: screenings } = useScreenings()
  const fetchBookings = useCallback(
 (signal: AbortSignal) =>
     getAdminBookings(screeningId ? { screeningId: Number(screeningId) } : {}, signal),
  [screeningId],
 )
  const {
    data: bookings,
    loading: bookingsLoading,
     error: bookingsError,
    refetch: refetchBookings,
    } = useFetch<Booking[]>(fetchBookings, { deps: [screeningId] })

      const [payingId, setPayingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  async function handlePay(booking: Booking) {
    if (payingId !== null) return
    setPayingId(booking.id)
    setFeedback(null)
    try {
      const result = await payBooking(booking.id)
      const points = result.pointsAwarded > 0 ? ` ${t('admin.bookings.action.points', { points: result.pointsAwarded })}` : ''
      setFeedback({ kind: 'success', text: `${t('admin.bookings.action.paidDone', { ref: booking.bookingRef })}${points}` })
      refetchStats()
    } catch (err) {
      const conflict = err instanceof ApiError && err.status === 409
      setFeedback({ kind: 'error', text: t(conflict ? 'admin.bookings.action.conflict' : 'admin.bookings.action.error') })
    } finally {
      refetchBookings()
      setPayingId(null)
    }
  }

  const dateTime = new Intl.DateTimeFormat(getIntlLocale(locale), {
   weekday: 'short',
   day: 'numeric',
   month: 'short',
   hour: '2-digit',
   minute: '2-digit',
   timeZone: 'Europe/Stockholm',
  })
  const cards = stats
    ? [
        {
          key: 'today',
          tone: 'info',
          icon: 'bi-ticket-perforated',
          label: t('admin.bookings.stats.today'),
          value: nf.format(stats.bookingsToday),
          detail: t('admin.bookings.stats.todayDetail', { pending: stats.bookingsWaiting, paid: stats.bookingsPaid }),
        },
        {
          key: 'revenue',
          tone: 'success',
          icon: 'bi-cash-coin',
          label: t('admin.bookings.stats.revenue'),
          value: `${nf.format(stats.expectedRevenue)} kr`,
          detail: t('admin.bookings.stats.revenueDetail', { paid: nf.format(stats.paidRevenue) }),
        },
        {
          key: 'occupancy',
          tone: 'warning',
          icon: 'bi-people',
          label: t('admin.bookings.stats.occupancy'),
          value: `${stats.occupancyRatePercent}%`,
          detail: t('admin.bookings.stats.occupancyDetail', { sold: stats.bookedSeatsToday, total: stats.totalSeatsToday }),
        },
      ]
    : []

  return (
    <div>
      <AdminPageHeader title={t('nav.bookingsCashier')} subtitle={t('admin.bookings.subtitle')} />

      {error && <EmptyState variant="error" title={t('admin.bookings.stats.error')} />}
      <QuickCheckIn />
      <div className="fv-kpi-grid">
        {cards.map((card) => (
          <div key={card.key} className={`fv-kpi fv-kpi--${card.tone}`}>
            <span className="fv-kpi__icon" aria-hidden="true">
              <i className={`bi ${card.icon}`} />
            </span>
            <div>
              <div className="fv-kpi__label">{card.label}</div>
              <div className="fv-kpi__value">{card.value}</div>
              <div className="fv-kpi__detail">{card.detail}</div>
            </div>
          </div>
        ))}
      </div>
            <div className="fv-screening-filter">
        <label htmlFor="fv-screening-filter" className="fv-screening-filter__label">
          {t('admin.bookings.filter.label')}
        </label>
        <select
          id="fv-screening-filter"
          className="fv-screening-filter__select"
          value={screeningId}
          onChange={(event) => setScreeningId(event.target.value)}
        >
          <option value="">{t('admin.bookings.filter.all')}</option>
          {(screenings ?? []).map((screening) => (
            <option key={screening.id} value={screening.id}>
              {dateTime.format(new Date(screening.startsAt))} — {screening.movieTitle}, {screening.cinema}
            </option>
          ))}
        </select>
        <span className="fv-screening-filter__live">
          <span className="fv-screening-filter__dot" aria-hidden="true" />
          {t('admin.bookings.filter.live')}
        </span>
      </div>
            {bookingsLoading && !bookings && <p role="status">{t('admin.bookings.table.loading')}</p>}
      {bookingsError && (
        <EmptyState
          variant="error"
          title={t('admin.bookings.table.error')}
          actionLabel={t('admin.bookings.table.retry')}
          onAction={refetchBookings}
        />
      )}
      {bookings && bookings.length === 0 && (
        <EmptyState title={t('admin.bookings.table.empty')} />
      )}
      {feedback && (
       <p role="status" className={`fv-feedback fv-feedback--${feedback.kind}`}>{feedback.text}</p>
      )}
      {bookings && bookings.length > 0 && (
       <BookingsTable bookings={bookings} payingId={payingId} onPay={handlePay} />
     )}
    </div>
  )
}