import { createContext, use } from 'react'
import type { Booking } from '../types/booking'

export interface BookingsContextValue {
  bookings: Booking[]
  loading: boolean
  error: string | null
  currentTime: number
  upcomingCount: number
  refresh: () => void
  cancelBooking: (id: number) => Promise<void>
}

export const BookingsContext = createContext<BookingsContextValue | undefined>(undefined)

export function useBookings(): BookingsContextValue {
  const context = use(BookingsContext)
  if (!context) throw new Error('useBookings must be used within a BookingsProvider')
  return context
}
