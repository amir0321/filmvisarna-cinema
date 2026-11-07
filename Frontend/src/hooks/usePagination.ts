import { useState } from 'react'

export interface UsePaginationResult<T> {
  page: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  pageItems: T[]
  setPage: (page: number) => void
}

export function usePagination<T>(items: readonly T[], pageSize: number): UsePaginationResult<T> {
  const [rawPage, setPage] = useState(1)

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('pageSize must be a positive integer')
  }

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = Math.min(Math.max(1, rawPage), totalPages)
  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  // Keep the stored page valid too, so removed pages cannot return when the list grows.
  if (rawPage !== page) setPage(page)

  return {
    page,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    pageItems: items.slice(startIndex, endIndex),
    setPage,
  }
}
