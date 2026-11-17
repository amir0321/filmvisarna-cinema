import { useTranslation } from '../context/LocaleContext'
import { useBookings } from '../hooks/useBookings'

export function BookingCountBadge() {
  const { t } = useTranslation()
  const { upcomingCount } = useBookings()
  if (upcomingCount === 0) return null

  return (
    <span className="fv-booking-count badge rounded-pill" aria-label={t(upcomingCount === 1 ? 'nav.bookingCountOne' : 'nav.bookingCountMany', { count: upcomingCount })}>
      {upcomingCount}
    </span>
  )
}
