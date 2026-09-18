import { createBrowserRouter, type RouteObject } from 'react-router'
import type { ComponentType } from 'react'
import App from './App'

interface PageModule {
  default?: ComponentType
  navOrder?: number
  navTitle?: string
  hideFromNav?: boolean
  [key: string]: unknown
}

const pages = import.meta.glob<PageModule>('./pages/**/*.tsx', { eager: true })

export interface NavItem {
  name: string
  path: string
}

export const navLinks: NavItem[] = Object.entries(pages)
  .filter(([, module]) => !module.hideFromNav)
  .map(([path, module]) => {
    const fileName = path.replace('./pages/', '').replace('.tsx', '')
    const isHome = fileName.toLowerCase() === 'home'

    return {
      name: module.navTitle || (isHome ? 'Home' : fileName),
      path: isHome ? '/' : `/${fileName.toLowerCase()}`,
      order: module.navOrder ?? 999,
    }
  })
  .filter((item) => !item.path.toLowerCase().includes('detail'))
  .sort((a, b) => a.order - b.order)
  .map(({ name, path }) => ({ name, path }))

const dynamicRoutes: RouteObject[] = Object.keys(pages).map((path) => {
  const fileName = path.replace('./pages/', '').replace('.tsx', '')

  const isHome = fileName.toLowerCase() === 'home'
  const isDetail = fileName.toLowerCase().includes('detail')

  const module = pages[path]
  const Component = (module.default ||
    module[fileName] ||
    Object.values(module)[0]) as ComponentType

  if (isHome) {
    return {
      index: true,
      element: Component ? <Component /> : null,
    }
  }

  return {
    path: isDetail ? `${fileName.toLowerCase()}/:id` : fileName.toLowerCase(),
    element: Component ? <Component /> : null,
  }
})

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: dynamicRoutes,
  },
])
