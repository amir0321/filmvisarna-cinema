import type { SimpleTranslationKey } from '../i18n'
import type { AdminMenuItem } from '../types'

// The backend only has food/drink plus isCombo, so menus get their own category here
export type KioskCategory = 'combo' | 'food' | 'drink'

export const KIOSK_CATEGORIES: Record<KioskCategory, { labelKey: SimpleTranslationKey; emoji: string }> = {
  combo: { labelKey: 'admin.kiosk.category.combo', emoji: '🎬' },
  food: { labelKey: 'admin.kiosk.category.food', emoji: '🍿' },
  drink: { labelKey: 'admin.kiosk.category.drink', emoji: '🥤' },
}

export function getKioskCategory(item: AdminMenuItem): KioskCategory {
  return item.isCombo ? 'combo' : item.category
}

