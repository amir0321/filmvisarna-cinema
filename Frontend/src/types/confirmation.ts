export interface ConfirmationData {
  bookingRef: string
  movieTitle: string
  posterUrl: string | null
  cinema: string
  startsAt: string
  endsAt: string
  seats: string[]
  tickets: { label: string; quantity: number; price: number }[]
  kiosk: { name: string; quantity: number; price: number }[]
  ticketTotal: number
  kioskTotal: number
  total: number
  email: string
  cancelToken?: string
}