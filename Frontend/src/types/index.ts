import type { ComponentType } from 'react'

export * from './movie'
export * from './screening'
export * from './seat'
export * from './booking'
export * from './user'
export * from './api'

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
