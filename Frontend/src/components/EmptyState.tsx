import React from 'react'
import { Link } from 'react-router'

export type EmptyStateVariant = 'empty' | 'error' | 'warning' | 'info' | 'success'

export interface EmptyStateProps {
  variant?: EmptyStateVariant
  icon?: string
  emoji?: string
  title: string
  description?: string
  actionLabel?: string
  actionVariant?: 'primary' | 'outline'
  onAction?: () => void
  actionTo?: string
  className?: string
  children?: React.ReactNode
}

export function EmptyState({
  variant = 'empty',
  icon,
  emoji,
  title,
  description,
  actionLabel,
  actionVariant,
  onAction,
  actionTo,
  className = '',
  children,
}: EmptyStateProps) {
  const isError = variant === 'error'
  const isWarning = variant === 'warning'
  const isInfo = variant === 'info'
  const isSuccess = variant === 'success'

  const defaultIcon = isError
    ? 'bi-exclamation-triangle'
    : isWarning
      ? 'bi-exclamation-circle'
      : isInfo
        ? 'bi-info-circle'
        : isSuccess
          ? 'bi-check-circle'
          : 'bi-film'
  const chosenIcon = icon || defaultIcon

  const combinedClass = ['fv-empty-state', className].filter(Boolean).join(' ')
  const iconClass = [
    'fv-empty-icon',
    isError ? 'is-error' : '',
    isWarning ? 'is-warning' : '',
    isInfo ? 'is-info' : '',
    isSuccess ? 'is-success' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const buttonClass =
    actionVariant === 'primary' || (!actionVariant && !isError && Boolean(actionTo))
      ? 'btn btn-danger px-4 fw-semibold'
      : 'btn btn-outline-danger px-4'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={combinedClass}
    >
      <div className={iconClass} aria-hidden="true">
        {emoji ? (
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{emoji}</span>
        ) : (
          <i className={`bi ${chosenIcon}`} />
        )}
      </div>

      <h3 className="fv-empty-title">{title}</h3>

      {description ? <p className="fv-empty-desc">{description}</p> : null}

      {children}

      {actionLabel ? (
        actionTo ? (
          <Link to={actionTo} className={buttonClass}>
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            type="button"
            className={buttonClass}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null
      ) : null}
    </div>
  )
}
