export interface KioskItem {
  id: number
  name: string
  description: string | null
  category: 'food' | 'drink'
  price: number
  is_combo: boolean
  image_url: string | null
  is_available: boolean
  combo_items: { id: number; name: string; quantity: number }[] | null
}