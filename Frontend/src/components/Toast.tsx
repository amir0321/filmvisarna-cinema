import React, { useState } from 'react'
import { useInlineFeedback } from '../hooks/useInlineFeedback'

export type InlineFeedbackVariant = 'success' | 'warning' | 'danger' | 'info'

export interface InlineFeedbackProps {
  variant?: InlineFeedbackVariant
  message: React.ReactNode
  className?: string
  id?: string
}

export function InlineFeedback({
  variant = 'info',
  message,
  className = '',
  id,
}: InlineFeedbackProps) {
  const isError = variant === 'danger'
  const combinedClass = [
    'fv-inline-feedback',
    `feedback-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const iconClass =
    variant === 'success'
      ? 'bi-check-circle-fill'
      : variant === 'warning'
        ? 'bi-exclamation-triangle-fill'
        : variant === 'danger'
          ? 'bi-exclamation-octagon-fill'
          : 'bi-info-circle-fill'

  return (
    <div
      id={id}
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={combinedClass}
    >
      <i className={`bi ${iconClass}`} aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

// Alias for backwards compatibility / semantic naming
export const Toast = InlineFeedback

export interface FeedbackButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  feedbackText?: string
  feedbackVariant?: 'filled' | 'soft'
  durationMs?: number
  onAction?: () => void | Promise<void>
}

export function FeedbackButton({
  children,
  feedbackText = 'Sparat!',
  feedbackVariant = 'filled',
  durationMs = 2000,
  onAction,
  onClick,
  className = 'btn btn-primary',
  disabled = false,
  ...rest
}: FeedbackButtonProps) {
  const [isFeedbackActive, triggerFeedback] = useInlineFeedback(durationMs)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isFeedbackActive) return

    if (onClick) {
      onClick(e)
    }
    if (onAction) {
      await onAction()
    }
    triggerFeedback()
  }

  const activeClass =
    feedbackVariant === 'soft' ? 'btn-feedback-active-soft' : 'btn-feedback-active'

  const combinedClass = [
    className,
    isFeedbackActive ? activeClass : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...rest}
      type={rest.type || 'button'}
      className={combinedClass}
      disabled={disabled}
      onClick={handleClick}
      aria-live="polite"
    >
      {isFeedbackActive ? (
        <>
          <i className="bi bi-check-lg me-1" aria-hidden="true" />
          <span>{feedbackText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export interface InlineConfirmActionProps {
  label: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: 'danger' | 'warning'
  className?: string
  disabled?: boolean
}

export function InlineConfirmAction({
  label,
  confirmLabel = 'Bekräfta',
  cancelLabel = 'Avbryt',
  onConfirm,
  variant = 'danger',
  className = '',
  disabled = false,
}: InlineConfirmActionProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = async () => {
    setIsPending(true)
    try {
      await onConfirm()
      setIsConfirming(false)
    } finally {
      setIsPending(false)
    }
  }

  if (isConfirming) {
    return (
      <div className={`fv-inline-confirm ${className}`.trim()}>
        <button
          type="button"
          className={`btn btn-${variant === 'danger' ? 'danger' : 'warning'} btn-sm fw-semibold`}
          onClick={handleConfirm}
          disabled={isPending}
        >
          {isPending ? (
            <span
              className="spinner-border spinner-border-sm me-1"
              role="status"
              aria-hidden="true"
            />
          ) : (
            <i className="bi bi-check-lg me-1" aria-hidden="true" />
          )}
          {confirmLabel}
        </button>
        <button
          type="button"
          className="btn-inline-cancel btn-sm"
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
        >
          {cancelLabel}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`btn btn-outline-${variant === 'danger' ? 'danger' : 'warning'} btn-sm ${className}`.trim()}
      onClick={() => setIsConfirming(true)}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

export interface PaidActionButtonProps {
  isPaid: boolean
  onMarkPaid?: () => void | Promise<void>
  className?: string
  disabled?: boolean
}

export function PaidActionButton({
  isPaid,
  onMarkPaid,
  className = '',
  disabled = false,
}: PaidActionButtonProps) {
  const [isPending, setIsPending] = useState(false)

  if (isPaid) {
    return (
      <span className={`badge-paid-confirmed ${className}`.trim()}>
        <i className="bi bi-check-lg" aria-hidden="true" />
        <span>✓ Betald</span>
      </span>
    )
  }

  const handleClick = async () => {
    if (!onMarkPaid || disabled || isPending) return
    setIsPending(true)
    try {
      await onMarkPaid()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      className={`btn-paid-action ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled || isPending}
    >
      {isPending ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      ) : (
        <i className="bi bi-check-lg" aria-hidden="true" />
      )}
      <span>Markera betald</span>
    </button>
  )
}
