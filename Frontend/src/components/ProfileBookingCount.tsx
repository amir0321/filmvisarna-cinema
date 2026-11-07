
import { useBookings } from '../hooks/useBookings'

export default function ProfileBookingCount() {
  const { bookings, loading, error } = useBookings()

  return (
    <div className="text-center">
      <strong className="fs-4">
        {error ? '–' : loading ? '…' : bookings.length}
      </strong>
      <p className="small text-secondary mb-0">Bokningar</p>
    </div>
  )
}
