export type BookingStatus = 'confirmed' | 'cancelled'

export interface TicketItem {
  seatId: number
  priceGroupId: number
  type?: string
  price?: number
  row?: string
  seatNumber?: number
}

export interface KioskOrderItem {
  itemId: number
  name?: string
  quantity: number
  price?: number
}

export interface Booking {
  id: number
  bookingRef: string
  screeningId: number
  movieTitle?: string
  cinemaName?: string
  screeningStartsAt?: string
  email: string
  guestName?: string | null
  tickets: TicketItem[]
  items?: KioskOrderItem[]
  totalPrice: number
  isPaid: boolean
  isCheckedIn: boolean
  status: BookingStatus
  createdAt?: string
}

export interface CancelPreviewResult {
  bookingRef: string
  movieTitle: string
  posterUrl: string | null
  cinemaName: string
  screeningStartsAt: string
  seats: string[]
  status: string
  canCancel: boolean
}

export interface CancelBookingResponse {
  success: boolean
  message: string
  booking: {
    id: number
    reference: string
    status: string
  }
}

export interface CancelBookingDetails {
  bookingRef: string
  movieTitle: string
  posterUrl?: string | null
  cinemaName: string
  screeningStartsAt: string
  seats: string[]
}
