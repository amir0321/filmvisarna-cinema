import { useTranslation } from '../../context/LocaleContext'
import { useState, useCallback } from 'react'
import { getAdminStats, type AdminStats, getAdminBookings, payBooking, checkInBooking } from '../../api/adminBookings'
import { ApiError } from '../../api/client'
import { getScreeningSeats } from '../../api/screeningSeats'
import { useFetch } from '../../hooks/useFetch'
import { useScreenings } from '../../hooks/useScreenings'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/EmptyState'
import QuickCheckIn from '../../components/admin/QuickCheckIn'
import BookingsTable from '../../components/admin/BookingsTable'
import type { Booking } from '../../types/booking'
import type { SeatsResponse } from '../../types/screeningSeat'
import BookingsSidePanel from '../../components/admin/BookingsSidePanel'
import { notifyBookingsChanged } from '../../utils/bookingUpdates'
import { formatDateShort, formatTime, toCinemaIsoDate } from '../../utils/date'
import { formatSek } from '../../utils/price'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/Pagination'
import ReseatModal from '../../components/admin/ReseatModal'

export default function AdminBookings() {
  const { t, locale } = useTranslation()
  const { data: stats, error, refetch: refetchStats } = useFetch<AdminStats>((signal) => getAdminStats(signal))
  const formatDateTime = (iso: string) =>
    `${formatDateShort(toCinemaIsoDate(iso), locale)} ${formatTime(iso, locale)}`
  const [screeningId, setScreeningId] = useState('')
  const [reseatBooking, setReseatBooking] = useState<Booking | null>(null)
  const [reseatError, setReseatError] = useState<string | null>(null)
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
    const pagination = usePagination(bookings ?? [], 10)

   const [payingId, setPayingId] = useState<number | null>(null)
    const [checkingInId, setCheckingInId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error' |'info'; text: string } | null>(null)

    const fetchSeats = useCallback(
    () => (screeningId ? getScreeningSeats(Number(screeningId)) : Promise.resolve(null)),
    [screeningId],
  )
  const { data: seatData, error: seatsError, refetch:refetchSeats } = useFetch<SeatsResponse | null>(fetchSeats, { deps: [screeningId] })

  const pendingSeatIds = (bookings ?? [])
    .filter((booking) => booking.status === 'reserved')
    .flatMap((booking) => booking.tickets.map((ticket) => ticket.seatId))
  const selectedScreening = (screenings ?? []).find((screening) => String(screening.id) === screeningId)
  const mapSubtitle = selectedScreening
    ? `${selectedScreening.cinema} · ${formatDateTime(selectedScreening.startsAt)}`
    : null

    // seatIds is only given when the admin has chosen new seats. Returns true when paid.
  async function handlePay(booking: Booking, seatIds?: number[]): Promise<boolean> {
    if (payingId !== null) return false
    setPayingId(booking.id)
    setFeedback(null)
    try {
      const result = await payBooking(booking.id, seatIds)
      const points = result.pointsAwarded > 0 ? ` ${t('admin.bookings.action.points', { points: result.pointsAwarded })}` : ''
      setFeedback({ kind: 'success', text: `${t('admin.bookings.action.paidDone', { ref: booking.bookingRef })}${points}` })
      refetchStats()
      notifyBookingsChanged()
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // A seat has been taken: let the admin choose new seats
        setReseatBooking(booking);
        //return false
        setReseatError(seatIds ? t('admin.bookings.action.conflict') : null)
      } else {
        setFeedback({ kind: 'error', text: t('admin.bookings.action.error') })
      }
      return false
    } finally {
      refetchBookings()
      refetchSeats()
      setPayingId(null)
    }
  }
  async function handleCheckIn(booking: Booking) {
    if (payingId !== null || checkingInId !== null) return
    setCheckingInId(booking.id)
    setFeedback(null)
    try {
      await checkInBooking(booking.id)
      setFeedback({ kind: 'success', text: t('admin.bookings.checkin.done', { ref: booking.bookingRef }) })
      refetchStats()
      notifyBookingsChanged()
    } catch {
      setFeedback({ kind: 'error', text: t('admin.bookings.checkin.error') })
    } finally {
      refetchBookings()
      refetchSeats()
      setCheckingInId(null)
    }
  }
function handleCancel() {
    setFeedback({ kind: 'info', text: t('admin.bookings.action.cancelUnavailable') })
  }
    // Called after a check-in: reload the list and the numbers, and tell other tabs
  const handleCheckedIn = () => {
   refetchBookings()
    refetchStats()
    refetchSeats()
    notifyBookingsChanged()
  }

  const cards = stats
    ? [
        {
          key: 'today',
          tone: 'info',
          icon: 'bi-ticket-perforated',
          label: t('admin.bookings.stats.today'),
          value: String(stats.bookingsToday),
          detail: t('admin.bookings.stats.todayDetail', { pending: stats.bookingsWaiting, paid: stats.bookingsPaid }),
        },
        {
          key: 'revenue',
          tone: 'success',
          icon: 'bi-cash-coin',
          label: t('admin.bookings.stats.revenue'),
          value: formatSek(stats.expectedRevenue, locale),
          detail: t('admin.bookings.stats.revenueDetail', { paid: formatSek(stats.paidRevenue, locale) }),
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
      <div className="fv-admin-bookings">
        <div className="fv-admin-bookings__main">
        <QuickCheckIn onCheckedIn={handleCheckedIn} /> 
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
          onChange={(event) => {
            setScreeningId(event.target.value)
            pagination.setPage(1) 
          }}
        >
          <option value="">{t('admin.bookings.filter.all')}</option>
          {(screenings ?? []).map((screening) => (
            <option key={screening.id} value={screening.id}>
            {formatDateTime(screening.startsAt)} — {screening.movieTitle}, {screening.cinema}
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
            {bookings && bookings.length > 0 && (
        <>
          <BookingsTable
            bookings={pagination.pageItems}
            totalCount={pagination.totalItems}
            payingId={payingId}
            onPay={handlePay}
            onCancel={handleCancel}
            checkingInId={checkingInId}
            onCheckIn={handleCheckIn}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </>
      )}
      {feedback && (
       <p role="status" className={`fv-feedback fv-feedback--${feedback.kind}`}>{feedback.text}</p>
      )}
     </div>
       <div className="fv-admin-bookings__side">
          <BookingsSidePanel
            stats={stats ?? null}
            seats={seatData?.seats ?? null}
            pendingSeatIds={pendingSeatIds}
            subtitle={mapSubtitle}
            seatsError={Boolean(seatsError)}
          />
        </div>
      </div>
          {reseatBooking && (
        <ReseatModal
          key={reseatBooking.id}
          booking={reseatBooking}
          paying={payingId === reseatBooking.id}
          error={reseatError}
          onConfirm={async (seatIds) => {
            const paid = await handlePay(reseatBooking, seatIds)
            if (paid) {
              setReseatBooking(null)
              setReseatError(null)
            }
            return paid
          }}
          onClose={() => {
            setReseatBooking(null)
            setReseatError(null)
          }}
        />
      )}
    </div>
  )
}