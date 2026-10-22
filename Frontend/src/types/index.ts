export interface Seat{
    id: number
    row_label: string
    seat_number: number
    status: string
}

export interface SeatsResponse{
    screeningId: number
    seats: Seat[]
}

export interface KioskItem{
    id: number
    name: string
    description: string | null
    category: 'food' | 'drink'
    price: number
    is_combo: boolean
    image_url: string | null
    is_available: boolean
    combo_items: {id: number; name: string, quantity: number} []

}