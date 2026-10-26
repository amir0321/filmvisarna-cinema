import React from 'react'

export type SkeletonVariant = 'text' | 'rect' | 'circle' | 'pill'

export interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
}: SkeletonProps) {
  const combinedClasses = [
    'fv-skeleton',
    `variant-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  }

  return <div className={combinedClasses} style={inlineStyles} aria-hidden="true" />
}

export function MovieCardSkeleton() {
  return (
    <div className="card h-100 shadow-sm border-0 bg-card text-light overflow-hidden">
      <div style={{ aspectRatio: '2 / 3', width: '100%' }}>
        <Skeleton variant="rect" />
      </div>
      <div className="card-body d-flex flex-column p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Skeleton variant="pill" width="60px" height="20px" />
          <Skeleton variant="pill" width="40px" height="20px" />
        </div>
        <Skeleton variant="text" width="80%" height="20px" className="mb-2" />
        <Skeleton variant="text" width="50%" height="14px" className="mb-3" />
        <div className="mt-auto pt-2">
          <Skeleton variant="rect" height="36px" className="rounded" />
        </div>
      </div>
    </div>
  )
}

export interface MovieGridSkeletonProps {
  count?: number
  className?: string
}

export function MovieGridSkeleton({
  count = 8,
  className = '',
}: MovieGridSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      role="status"
      aria-busy="true"
      className={`row g-4 ${className}`.trim()}
    >
      <span className="visually-hidden">Laddar filmer...</span>
      {items.map((i) => (
        <div key={i} className="col-12 col-md-6 col-lg-3">
          <MovieCardSkeleton />
        </div>
      ))}
    </div>
  )
}

export interface CardListSkeletonProps {
  count?: number
  className?: string
}

export function CardListSkeleton({
  count = 3,
  className = '',
}: CardListSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      role="status"
      aria-busy="true"
      className={`d-flex flex-column gap-3 ${className}`.trim()}
    >
      <span className="visually-hidden">Laddar innehåll...</span>
      {items.map((i) => (
        <div
          key={i}
          className="card bg-card border-secondary border-opacity-25 p-4 rounded-3"
        >
          <div className="d-flex align-items-center gap-3">
            <Skeleton variant="rect" width="56px" height="84px" className="rounded-2 flex-shrink-0" />
            <div className="flex-grow-1">
              <Skeleton variant="text" width="40%" height="20px" className="mb-2" />
              <Skeleton variant="text" width="60%" height="14px" className="mb-2" />
              <Skeleton variant="text" width="30%" height="14px" />
            </div>
            <Skeleton variant="rect" width="100px" height="36px" className="rounded-pill d-none d-sm-block" />
          </div>
        </div>
      ))}
    </div>
  )
}
