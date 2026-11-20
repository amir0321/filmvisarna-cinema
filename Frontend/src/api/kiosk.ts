import apiClient from './client'
import type { AdminMenuItem, KioskItem } from '../types/kiosk'

export function getKioskItems(): Promise<KioskItem[]> {
  return apiClient.get<KioskItem[]>('/kiosk')
}

export interface CreateAdminMenuItemInput {
  name: string
  category: 'food' | 'drink'
  price: number
  description: string | null
  imageUrl: string | null
}

export interface UpdateAdminMenuItemInput {
  name?: string
  category?: 'food' | 'drink'
  price?: number
  description?: string | null
  imageUrl?: string | null
  isAvailable?: boolean
}

export function getAdminMenuItems(signal?: AbortSignal): Promise<AdminMenuItem[]> {
  return apiClient.get<AdminMenuItem[]>('/admin/menu-items', { signal })
}

export function createAdminMenuItem(input: CreateAdminMenuItemInput): Promise<AdminMenuItem> {
  return apiClient.post<AdminMenuItem>('/admin/menu-items', input)
}

export function updateAdminMenuItem(id: number, input: UpdateAdminMenuItemInput): Promise<AdminMenuItem> {
  return apiClient.patch<AdminMenuItem>(`/admin/menu-items/${id}`, input)
}
