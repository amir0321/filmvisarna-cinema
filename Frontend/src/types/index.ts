import type { ComponentType } from 'react'

export interface Movie {
  id: number
  title: string
  description?: string | null
  genres?: string[]
  duration_minutes?: number | null
  duration?: number | null
  age_rating?: string | null
  poster_url?: string | null
  landscape_image_url?: string | null
  trailer_url?: string | null
  director?: string | null
  imdb_rating?: number | null
  release_date?: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface NavItem {
  name: string
  path: string
}

export interface PageModule {
  default?: ComponentType
  navOrder?: number
  navTitle?: string
  hideFromNav?: boolean
  [key: string]: unknown
}
