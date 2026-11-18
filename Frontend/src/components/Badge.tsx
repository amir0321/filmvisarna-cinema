import type { SimpleTranslationKey } from '../i18n'
import React from 'react'
import { useTranslation } from '../context/LocaleContext'

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'
  | 'genre'
  | 'runtime'
  | 'premiere'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  pill?: boolean
  children: React.ReactNode
}

export function Badge({
  variant = 'primary',
  pill = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const classes = [
    'fv-badge',
    `fv-badge-${variant}`,
    pill ? 'fv-badge-pill' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}

export type AgeBadgeVariant = 'poster-home' | 'poster-filmer' | 'admin'

export interface AgeBadgeProps {
  ageRating: string | number | null | undefined
  variant?: AgeBadgeVariant
  className?: string
}

export function AgeBadge({
  ageRating,
  variant = 'poster-filmer',
  className = '',
}: AgeBadgeProps) {
  const { t } = useTranslation()
  const rawStr = ageRating != null ? String(ageRating).trim() : ''
  const parsedNum = parseInt(rawStr, 10)
  const isAll =
    !rawStr ||
    rawStr.toLowerCase() === 'alla' ||
    (!Number.isNaN(parsedNum) && parsedNum === 0)
  const age = Number.isNaN(parsedNum) ? 0 : parsedNum

  let label: string
  let badgeClass: string

  if (variant === 'poster-home') {
    if (isAll) {
      label = t('common.all')
      badgeClass = 'fv-age-badge-poster-home age-all'
    } else {
      label = t('movie.age', { age })
      badgeClass = 'fv-age-badge-poster-home age-restricted'
    }
  } else if (variant === 'admin') {
    if (isAll) {
      label = t('common.all')
      badgeClass = 'fv-age-badge-admin age-all'
    } else {
      label = t('movie.age', { age })
      badgeClass = 'fv-age-badge-admin age-restricted'
    }
  } else {
    // poster-filmer default
    if (isAll) {
      label = t('common.all')
      badgeClass = 'fv-age-badge-poster-filmer age-all'
    } else if (age >= 15) {
      label = `${age}`
      badgeClass = 'fv-age-badge-poster-filmer age-15'
    } else {
      label = `${age}`
      badgeClass = 'fv-age-badge-poster-filmer age-mid'
    }
  }

  const combinedClass = ['fv-badge', badgeClass, className].filter(Boolean).join(' ')

  return <span className={combinedClass}>{label}</span>
}

export type BookingOrEntityStatus =
  | 'paid'
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'member'
  | 'guest-member'
  | 'verified'

export interface StatusBadgeProps {
  status: BookingOrEntityStatus
  className?: string
}

const STATUS_CONFIG: Record<
  BookingOrEntityStatus,
  { label: SimpleTranslationKey; modifier: string }
> = {
  paid: { label: 'status.paid', modifier: 'status-paid' },
  pending: { label: 'status.pending', modifier: 'status-pending' },
  active: { label: 'status.active', modifier: 'status-active' },
  cancelled: { label: 'status.cancelled', modifier: 'status-cancelled' },
  member: { label: 'status.member', modifier: 'status-member' },
  'guest-member': { label: 'status.guestMember', modifier: 'status-guest-member' },
  verified: { label: 'status.verified', modifier: 'status-verified' },
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { t } = useTranslation()
  const config = STATUS_CONFIG[status]
  const combinedClass = [
    'fv-status-badge',
    config.modifier,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={combinedClass}>{t(config.label)}</span>
}

export interface AuditoriumBadgeProps {
  auditorium: 1 | 2 | 'Salong 1' | 'Salong 2' | string
  className?: string
}

export function AuditoriumBadge({
  auditorium,
  className = '',
}: AuditoriumBadgeProps) {
  const { t } = useTranslation()
  const isSalong2 =
    auditorium === 2 ||
    auditorium === 'Salong 2' ||
    String(auditorium).toLowerCase().includes('2')

  const label = isSalong2 ? t('salonger.hall2.title') : t('salonger.hall1.title')
  const modifier = isSalong2 ? 'auditorium-2' : 'auditorium-1'

  const combinedClass = ['fv-auditorium-badge', modifier, className]
    .filter(Boolean)
    .join(' ')

  return <span className={combinedClass}>{label}</span>
}

export interface StarRatingBadgeProps {
  rating: number | null | undefined
  className?: string
}

export function StarRatingBadge({ rating, className = '' }: StarRatingBadgeProps) {
  if (rating == null || Number.isNaN(rating)) {
    return null
  }

  const combinedClass = ['fv-star-rating', className].filter(Boolean).join(' ')

  return (
    <span className={combinedClass}>
      <i className="bi bi-star-fill star-icon" aria-hidden="true" />
      <span className="rating-score">{rating.toFixed(1)}</span>
      <span className="rating-source">IMDb</span>
    </span>
  )
}

export interface PremiereBannerProps {
  premiereDate: string
  className?: string
}

export function PremiereBanner({
  premiereDate,
  className = '',
}: PremiereBannerProps) {
  const { t } = useTranslation()
  const combinedClass = ['fv-badge-premiere', className].filter(Boolean).join(' ')
  return <div className={combinedClass}>{t('status.premiere', { date: premiereDate.toUpperCase() })}</div>
}
