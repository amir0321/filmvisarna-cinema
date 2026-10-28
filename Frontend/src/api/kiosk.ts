import apiClient from './client'
import type { KioskItem } from '../types/kiosk'

export function getKioskItems(): Promise<KioskItem[]> {
  return apiClient.get<KioskItem[]>('/kiosk')
}