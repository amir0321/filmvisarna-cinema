export type BookingStatus = 'confirmed' | 'cancelled'

export interface BookingRequestPayload {
  screeningId: number
  email: string
  guestName: string
  tickets: { seatId: number; priceGroupId: number }[]
  items: { itemId: number; quantity: number }[]
}

export interface BookingCreatedResult {
  bookingRef: string
  cancelToken?: string
  booking: Booking
}

export interface GuestBookingPreview {
  email: string
  guestName: string | null
  expiresAt: string
  screening: { id: number; movieTitle: string; posterUrl: string | null; cinema: string; startsAt: string; endsAt: string }
  tickets: { seatId: number; priceGroupId: number; row: string; number: number; name: string; price: number }[]
  items: { itemId: number; name: string; quantity: number; price: number }[]
  totalPrice: number
}

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
  screeningEndsAt?: string
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
