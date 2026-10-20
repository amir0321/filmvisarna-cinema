export type SeatType = 'regular' | 'wheelchair'
export type SeatStatus = 'available' | 'booked' | 'selected'

export interface Seat {
  id: number
  row: string
  number: number
  seatType: SeatType
  isWheelchair?: boolean
  status?: SeatStatus
}

export interface ScreeningSeatStatus {
  id: number
  row_label: string
  seat_number: number
  seat_type: SeatType
  is_wheelchair: boolean
  status: 'booked' | 'available'
}
