import React from 'react'

export const LOW_SEATS_THRESHOLD = 10
export const LOW_SEATS_DETAIL_THRESHOLD = 15

export type PillVariant = 'standard' | 'genre' | 'age'

export interface FilterPillProps {
  active: boolean
  onClick: () => void
  variant?: PillVariant
  children: React.ReactNode
  className?: string
  disabled?: boolean
  id?: string
}

export function FilterPill({
  active,
  onClick,
  variant = 'standard',
  children,
  className = '',
  disabled = false,
  id,
}: FilterPillProps) {
  let baseClass: string
  if (variant === 'genre') {
    baseClass = `fv-chip-genre ${active ? 'active' : ''}`
  } else if (variant === 'age') {
    baseClass = `fv-chip-age ${active ? 'active' : ''}`
  } else {
    // standard chip
    baseClass = `chip ${active ? 'chip-active' : 'chip-inactive'}`
  }

  const combinedClass = [baseClass, className].filter(Boolean).join(' ')

  return (
    <button
      id={id}
      type="button"
      className={combinedClass}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

export interface FilterOption<T extends string = string> {
  value: T
  label: string
  count?: number
}

export interface FilterPillGroupProps<T extends string = string> {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  variant?: PillVariant
  ariaLabel: string
  className?: string
}

export function FilterPillGroup<T extends string = string>({
  options,
  value,
  onChange,
  variant = 'standard',
  ariaLabel,
  className = '',
}: FilterPillGroupProps<T>) {
  const combinedClass = ['fv-pill-group', className].filter(Boolean).join(' ')

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={combinedClass}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <FilterPill
            key={option.value}
            active={isActive}
            variant={variant}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined ? ` (${option.count})` : null}
          </FilterPill>
        )
      })}
    </div>
  )
}

export interface ScreeningPillProps {
  time: string
  auditorium?: string
  seatsLeft?: number
  onClick?: () => void
  compact?: boolean
  className?: string
  disabled?: boolean
}

export function ScreeningPill({
  time,
  auditorium,
  seatsLeft,
  onClick,
  compact = false,
  className = '',
  disabled = false,
}: ScreeningPillProps) {
  const isLow = seatsLeft !== undefined && seatsLeft < LOW_SEATS_THRESHOLD
  const isInteractive = Boolean(onClick)

  const classes = [
    'fv-screening-pill',
    compact ? 'compact' : '',
    isInteractive ? 'interactive' : '',
    isLow ? 'fv-screening-pill-low' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span className="pill-time">{time}</span>
      {auditorium ? <span className="pill-auditorium"> · {auditorium}</span> : null}
      {isLow && seatsLeft !== undefined ? (
        <span className="seats-left ms-1">({seatsLeft} kvar)</span>
      ) : null}
    </>
  )

  if (isInteractive) {
    return (
      <button
        type="button"
        className={classes}
        onClick={onClick}
        disabled={disabled}
        aria-label={`${time}${auditorium ? ` ${auditorium}` : ''}${
          isLow && seatsLeft !== undefined ? `, ${seatsLeft} platser kvar` : ''
        }`}
      >
        {content}
      </button>
    )
  }

  return <span className={classes}>{content}</span>
}
