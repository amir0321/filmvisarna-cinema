import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { cancelMyBooking, getMyBookings, getMyReservationStatus } from '../api/bookings'
import { useAuth } from '../hooks/useAuth'
import { BookingsContext } from '../hooks/useBookings'
import type { Booking, ReservationWarningStatus } from '../types/booking'
import { getBookingState } from '../utils/bookings'
import { subscribeToBookingChanges } from '../utils/bookingUpdates'

interface BookingSnapshot {
  userId: number
  bookings: Booking[]
  error: string | null
  reservationStatus: ReservationWarningStatus | null
  reservationStatusError: boolean
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const userId = user?.id
  const [snapshot, setSnapshot] = useState<BookingSnapshot | null>(null)
  const [revision, setRevision] = useState(0)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    if (userId === undefined) return
    const updateTime = () => setCurrentTime(Date.now())
    const timer = window.setInterval(updateTime, 1000)
    window.addEventListener('focus', updateTime)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', updateTime)
    }
  }, [userId])

  useEffect(() => {
    if (authLoading || userId === undefined || !isAuthenticated) return
    const controller = new AbortController()

    Promise.allSettled([getMyBookings(controller.signal), getMyReservationStatus(controller.signal)]).then(([bookings, status]) => {
      if (controller.signal.aborted) return
      setSnapshot({
        userId,
        bookings: bookings.status === 'fulfilled' ? bookings.value : [],
        error: bookings.status === 'rejected' ? bookings.reason instanceof Error ? bookings.reason.message : 'Kunde inte hämta bokningarna.' : null,
        reservationStatus: status.status === 'fulfilled' ? status.value : null,
        reservationStatusError: status.status === 'rejected',
      })
    })

    return () => controller.abort()
  }, [authLoading, userId, isAuthenticated, revision])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    if (userId === undefined || !isAuthenticated) return
    const unsubscribe = subscribeToBookingChanges(refresh)
    // A cashier can register payment from another device while this page is open.
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') refresh()
    }, 30_000)
    return () => {
      unsubscribe()
      window.clearInterval(timer)
    }
  }, [userId, isAuthenticated, refresh])

  const cancelBooking = useCallback(async (id: number) => {
    await cancelMyBooking(id)
    setSnapshot((previous) => {
      if (!previous || previous.userId !== userId) return previous
      return {
        ...previous,
        bookings: previous.bookings.map((booking) => booking.id === id ? { ...booking, status: 'cancelled' } : booking),
      }
    })
    refresh()
  }, [userId, refresh])

  const ownedSnapshot = user && isAuthenticated && snapshot?.userId === user.id ? snapshot : null
  const bookings = ownedSnapshot?.bookings ?? []
  const error = ownedSnapshot?.error ?? null
  const reservationStatus = ownedSnapshot?.reservationStatus ?? null
  const reservationStatusError = ownedSnapshot?.reservationStatusError ?? false
  const loading = authLoading || Boolean(user && isAuthenticated && !ownedSnapshot)
  const upcomingCount = bookings.filter((booking) => ['upcoming', 'ongoing'].includes(getBookingState(booking, currentTime))).length

  return (
    <BookingsContext value={{ bookings, loading, error, reservationStatus, reservationStatusError, currentTime, upcomingCount, refresh, cancelBooking }}>
      {children}
    </BookingsContext>
  )
}
