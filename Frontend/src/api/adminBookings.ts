import apiClient from './client'
import { mapBooking, type BookingApiResponse } from './bookings'
import type { Booking, BookingStatus } from '../types/booking'

export interface AdminStats {
  bookingsToday: number
  bookingsWaiting: number
  bookingsPaid: number
  expectedRevenue: number
  paidRevenue: number
  totalSeatsToday: number
  bookedSeatsToday: number
  occupancyRatePercent: number
}
export interface BookingFilters {
  screeningId?: number
  status?: BookingStatus
  isPaid?: boolean
  search?: string
  from?: string
  to?: string
}

export async function getAdminBookings(
  filters: BookingFilters = {},
  signal?: AbortSignal,
): Promise<Booking[]> {
  const response = await apiClient.get<BookingApiResponse[]>('/bookings', { params: { ...filters }, signal })
  return response.map(mapBooking)
}

export async function lookupBookingByReference(reference: string, signal?: AbortSignal): Promise<Booking> {
  const response = await apiClient.get<BookingApiResponse>('/bookings/lookup', { params: { reference }, signal })
  return mapBooking(response)
}

interface BookingActionApiResponse {
  success: boolean
  message: string
  booking: BookingApiResponse
  pointsAwarded?: number
}

export interface BookingActionResult {
  message: string
  booking: Booking
  pointsAwarded: number
}

function mapAction(r: BookingActionApiResponse): BookingActionResult {
  return { message: r.message, booking: mapBooking(r.booking), pointsAwarded: r.pointsAwarded ?? 0 }
}

export async function payBooking(id: number, seatIds?: number[]): Promise<BookingActionResult> {
  return mapAction(await apiClient.patch<BookingActionApiResponse>(`/bookings/${id}/pay`, seatIds ? { seatIds } : undefined))
}

export async function checkInBooking(id: number): Promise<BookingActionResult> {
  return mapAction(await apiClient.patch<BookingActionApiResponse>(`/bookings/${id}/checkin`))
}
export function getAdminStats(signal?: AbortSignal): Promise<AdminStats> {
  return apiClient.get<AdminStats>('/admin/stats', { signal })
}