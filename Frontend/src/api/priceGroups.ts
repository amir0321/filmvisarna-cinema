import apiClient from './client'

export interface PriceGroup {
  id: number
  name: string
  price: number
}

export function getPriceGroups(): Promise<PriceGroup[]> {
  return apiClient.get<PriceGroup[]>('/price-groups')
}