import type { AdminMenuItem } from '../types'

// The backend only has food/drink plus isCombo, so menus get their own category here
export type KioskCategory = 'combo' | 'food' | 'drink'

export const KIOSK_CATEGORIES: Record<KioskCategory, { label: string; emoji: string }> = {
  combo: { label: 'Menyer & Paket', emoji: '🎬' },
  food: { label: 'Popcorn & Snacks', emoji: '🍿' },
  drink: { label: 'Dryck', emoji: '🥤' },
}

export function getKioskCategory(item: AdminMenuItem): KioskCategory {
  return item.isCombo ? 'combo' : item.category
}
