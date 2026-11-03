import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { cancelMyBooking, getMyBookings } from '../api/bookings'
import { getAuthToken } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { BookingsContext } from '../hooks/useBookings'
import type { Booking } from '../types/booking'
import { getBookingState } from '../utils/bookings'

interface BookingSnapshot {
  userId: number
  bookings: Booking[]
  error: string | null
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id
  const token = getAuthToken()
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
    if (authLoading || userId === undefined || !token) return
    const controller = new AbortController()

    getMyBookings(controller.signal).then(
      (bookings) => {
        if (!controller.signal.aborted) setSnapshot({ userId, bookings, error: null })
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setSnapshot({ userId, bookings: [], error: error instanceof Error ? error.message : 'Kunde inte hämta bokningarna.' })
        }
      },
    )

    return () => controller.abort()
  }, [authLoading, userId, token, revision])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])
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

  const ownedSnapshot = user && token && snapshot?.userId === user.id ? snapshot : null
  const bookings = ownedSnapshot?.bookings ?? []
  const error = ownedSnapshot?.error ?? null
  const loading = authLoading || Boolean(user && token && !ownedSnapshot)
  const upcomingCount = bookings.filter((booking) => getBookingState(booking, currentTime) === 'upcoming').length

  return (
    <BookingsContext value={{ bookings, loading, error, currentTime, upcomingCount, refresh, cancelBooking }}>
      {children}
    </BookingsContext>
  )
}
