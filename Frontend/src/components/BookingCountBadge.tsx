import { useBookings } from '../hooks/useBookings'

export function BookingCountBadge() {
  const { upcomingCount } = useBookings()
  if (upcomingCount === 0) return null

  return (
    <span className="fv-booking-count badge rounded-pill" aria-label={`${upcomingCount} ${upcomingCount === 1 ? 'aktuell bokning' : 'aktuella bokningar'}`}>
      {upcomingCount}
    </span>
  )
}
