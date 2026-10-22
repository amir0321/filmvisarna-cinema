export type TicketType = 'adult' | 'senior' | 'child'

export const TICKET_TYPES: {
  type: TicketType
  label: string
  price: number
  priceGroupId: number
}[] = [
  { type: 'adult', label: 'Vuxen', price: 140, priceGroupId: 2 },
  { type: 'senior', label: 'Pensionär', price: 120, priceGroupId: 3 },
  { type: 'child', label: 'Barn (under 12)', price: 80, priceGroupId: 1 },
]