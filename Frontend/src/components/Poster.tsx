import React, { useState } from 'react'

export interface PosterProps {
  src?: string | null
  fallbackSrc?: string | null
  alt: string
  title?: string
  aspectRatio?: '2/3' | '16/9'
  size?: 'fill' | 'sm' | 'md'
  hoverZoom?: boolean
  topLeftBadge?: React.ReactNode
  topRightBadge?: React.ReactNode
  banner?: React.ReactNode
  className?: string
  loading?: 'lazy' | 'eager'
}

export function Poster({
  src,
  fallbackSrc,
  alt,
  title,
  aspectRatio = '2/3',
  size = 'fill',
  hoverZoom = false,
  topLeftBadge,
  topRightBadge,
  banner,
  className = '',
  loading = 'lazy',
}: PosterProps) {
  const [prevSrc, setPrevSrc] = useState(src)
  const [prevFallbackSrc, setPrevFallbackSrc] = useState(fallbackSrc)
  const [failedSources, setFailedSources] = useState<string[]>([])

  // Reset error state when src changes without requiring an extra useEffect
  if (prevSrc !== src || prevFallbackSrc !== fallbackSrc) {
    setPrevSrc(src)
    setPrevFallbackSrc(fallbackSrc)
    setFailedSources([])
  }

  const imageSrc = [src, fallbackSrc].find((source) => source && !failedSources.includes(source))
  const showFallback = !imageSrc
  const displayTitle = title || alt

  const containerClasses = [
    'fv-poster',
    aspectRatio === '16/9' ? 'aspect-16-9' : '',
    size === 'sm' ? 'size-sm' : size === 'md' ? 'size-md' : '',
    hoverZoom ? 'hover-zoom' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClasses}>
      {banner ? <div className="fv-poster-slot-banner">{banner}</div> : null}
      {topLeftBadge ? <div className="fv-poster-slot-tl">{topLeftBadge}</div> : null}
      {topRightBadge ? <div className="fv-poster-slot-tr">{topRightBadge}</div> : null}

      {showFallback ? (
        <div className="fv-poster-fallback">
          <i className="bi bi-film fallback-icon" aria-hidden="true" />
          <span className="fallback-title">{displayTitle}</span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          loading={loading}
          className="fv-poster-img"
          onError={() => {
            if (imageSrc) setFailedSources((sources) => [...sources, imageSrc])
          }}
        />
      )}
    </div>
  )
}
