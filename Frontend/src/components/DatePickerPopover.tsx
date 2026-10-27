import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import {
  addDaysToIsoDate,
  addMonthsToIsoDate,
  capitalize,
  daysInMonth,
  formatDateLong,
  formatMonthYear,
  startOfMonthIsoDate,
  todayIsoDate,
  weekdayIndex,
} from '../utils/date'

interface DatePickerPopoverProps {
  id: string
  anchorRef: RefObject<HTMLElement | null>
  selectedDate: string | null
  minDate: string
  maxDate: string
  onSelect: (isoDate: string) => void
  onClose: () => void
}

const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
const GAP = 8

function clampDate(date: string, min: string, max: string): string {
  if (date < min) return min
  if (date > max) return max
  return date
}

function getWeeks(monthStart: string): (string | null)[][] {
  const days: (string | null)[] = Array(weekdayIndex(monthStart)).fill(null)
  for (let i = 0; i < daysInMonth(monthStart); i++) {
    days.push(addDaysToIsoDate(monthStart, i))
  }
  while (days.length % 7 !== 0) days.push(null)

  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

export default function DatePickerPopover({
  id,
  anchorRef,
  selectedDate,
  minDate,
  maxDate,
  onSelect,
  onClose,
}: DatePickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const shouldFocusDay = useRef(true)
  const today = todayIsoDate()
  const [focusedDate, setFocusedDate] = useState(() => clampDate(selectedDate ?? today, minDate, maxDate))

  const monthStart = startOfMonthIsoDate(focusedDate)

  // Follow the button when the page scrolls
  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current
      const popover = popoverRef.current
      if (!anchor || !popover) return

      const rect = anchor.getBoundingClientRect()
      const maxLeft = window.innerWidth - popover.offsetWidth - GAP
      popover.style.top = `${rect.bottom + GAP}px`
      popover.style.left = `${Math.max(GAP, Math.min(rect.left, maxLeft))}px`
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true })
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true })
      window.removeEventListener('resize', updatePosition)
    }
  }, [anchorRef])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [anchorRef, onClose])

  useEffect(() => {
    if (!shouldFocusDay.current) return
    shouldFocusDay.current = false
    popoverRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedDate}"]`)?.focus()
  }, [focusedDate])

  function closeAndReturnFocus() {
    onClose()
    anchorRef.current?.focus()
  }

  function changeMonth(months: number) {
    setFocusedDate(clampDate(addMonthsToIsoDate(focusedDate, months), minDate, maxDate))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    let days: number
    if (event.key === 'ArrowLeft') days = -1
    else if (event.key === 'ArrowRight') days = 1
    else if (event.key === 'ArrowUp') days = -7
    else if (event.key === 'ArrowDown') days = 7
    else return

    event.preventDefault()
    shouldFocusDay.current = true
    setFocusedDate(clampDate(addDaysToIsoDate(focusedDate, days), minDate, maxDate))
  }

  return (
    <div
      ref={popoverRef}
      id={id}
      role="dialog"
      aria-label="Välj datum"
      className="date-picker-popover"
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeAndReturnFocus()
      }}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null
        if (next && !popoverRef.current?.contains(next) && !anchorRef.current?.contains(next)) {
          onClose()
        }
      }}
    >
      <div className="d-flex align-items-center justify-content-between mb-2">
        <button
          type="button"
          className="date-picker-popover__nav"
          aria-label="Föregående månad"
          disabled={monthStart <= startOfMonthIsoDate(minDate)}
          onClick={() => changeMonth(-1)}
        >
          <i className="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <p className="date-picker-popover__month mb-0" aria-live="polite">
          {capitalize(formatMonthYear(monthStart))}
        </p>
        <button
          type="button"
          className="date-picker-popover__nav"
          aria-label="Nästa månad"
          disabled={monthStart >= startOfMonthIsoDate(maxDate)}
          onClick={() => changeMonth(1)}
        >
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>

      <table className="date-picker-popover__grid" onKeyDown={handleKeyDown}>
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th key={weekday} scope="col">
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {getWeeks(monthStart).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => {
                if (!date) return <td key={dayIndex}></td>

                const isSelected = date === selectedDate
                const isToday = date === today
                let className = 'date-picker-popover__day'
                if (isSelected) className += ' date-picker-popover__day--selected'
                if (isToday) className += ' date-picker-popover__day--today'

                return (
                  <td key={date}>
                    <button
                      type="button"
                      data-date={date}
                      className={className}
                      tabIndex={date === focusedDate ? 0 : -1}
                      disabled={date < minDate || date > maxDate}
                      aria-pressed={isSelected}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={capitalize(formatDateLong(date))}
                      onClick={() => {
                        onSelect(date)
                        closeAndReturnFocus()
                      }}
                    >
                      {Number(date.slice(8))}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
