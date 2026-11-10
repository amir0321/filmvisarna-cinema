import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import type { ScreeningProgramme } from '../hooks/useScreeningProgramme'
import { getAvailableCalendarDate } from '../utils/screeningDates'
import {
  addDaysToIsoDate,
  addMonthsToIsoDate,
  capitalize,
  daysInMonth,
  formatDateLong,
  formatMonthYear,
  startOfMonthIsoDate,
  weekdayIndex,
} from '../utils/date'

interface DatePickerPopoverProps {
  programme: ScreeningProgramme
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
  programme,
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
  const { today, dates: availableDates, availableDates: availableDateSet, loading, error, refetch } = programme
  const [focusedDate, setFocusedDate] = useState(() => clampDate(selectedDate ?? today, minDate, maxDate))
  const activeDate = getAvailableCalendarDate(availableDates, focusedDate) ?? availableDates.at(-1)

  const monthStart = startOfMonthIsoDate(activeDate ?? focusedDate)
  const previousMonthDate = getAvailableCalendarDate(availableDates, addDaysToIsoDate(monthStart, -1), -1)
  const nextMonthDate = getAvailableCalendarDate(availableDates, addMonthsToIsoDate(monthStart, 1))

  // Follow the button when the page scrolls
  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current
      const popover = popoverRef.current
      if (!anchor || !popover) return

      const rect = anchor.getBoundingClientRect()
      const maxLeft = window.innerWidth - popover.offsetWidth - GAP
      const below = rect.bottom + GAP
      const above = rect.top - popover.offsetHeight - GAP
      const top = below + popover.offsetHeight <= window.innerHeight - GAP
        ? below
        : above >= GAP ? above : Math.max(GAP, window.innerHeight - popover.offsetHeight - GAP)
      popover.style.top = `${top}px`
      popover.style.left = `${Math.max(GAP, Math.min(rect.left, maxLeft))}px`
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true })
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true })
      window.removeEventListener('resize', updatePosition)
    }
  }, [anchorRef, loading, error, monthStart])

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
    if (loading || error || !activeDate) {
      popoverRef.current?.focus()
      return
    }
    shouldFocusDay.current = false
    popoverRef.current?.querySelector<HTMLButtonElement>(`[data-date="${activeDate}"]`)?.focus()
  }, [activeDate, loading, error])

  function closeAndReturnFocus() {
    onClose()
    anchorRef.current?.focus()
  }

  function focusDate(date: string | undefined) {
    if (!date) return
    shouldFocusDay.current = true
    setFocusedDate(date)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    let days: number
    if (event.key === 'ArrowLeft') days = -1
    else if (event.key === 'ArrowRight') days = 1
    else if (event.key === 'ArrowUp') days = -7
    else if (event.key === 'ArrowDown') days = 7
    else return

    event.preventDefault()
    if (!activeDate) return
    focusDate(getAvailableCalendarDate(availableDates, addDaysToIsoDate(activeDate, days), days > 0 ? 1 : -1))
  }

  return (
    <div
      ref={popoverRef}
      id={id}
      role="dialog"
      aria-label="Välj datum"
      aria-describedby={`${id}-availability`}
      aria-busy={loading}
      tabIndex={-1}
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
          disabled={loading || Boolean(error) || !previousMonthDate}
          onClick={() => focusDate(previousMonthDate)}
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
          disabled={loading || Boolean(error) || !nextMonthDate}
          onClick={() => focusDate(nextMonthDate)}
        >
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>

      <div id={`${id}-availability`} className="date-picker-popover__availability">
        {loading ? <p role="status">Hämtar visningsdatum...</p>
          : error ? <div role="alert">
            <p>Kunde inte hämta visningsdatum.</p>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={() => void refetch()}>Försök igen</button>
          </div>
            : availableDates.length === 0 ? <p role="status">Inga planerade visningar under perioden.</p>
              : <p className="date-picker-popover__legend">Markerade datum har visningar. Grå datum kan inte väljas.</p>}
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
                const hasScreenings = availableDateSet.has(date)
                const disabled = loading || Boolean(error) || !hasScreenings
                let className = 'date-picker-popover__day'
                if (isSelected) className += ' date-picker-popover__day--selected'
                if (isToday) className += ' date-picker-popover__day--today'
                if (hasScreenings && !loading && !error) className += ' date-picker-popover__day--available'

                return (
                  <td key={date}>
                    <button
                      type="button"
                      data-date={date}
                      className={className}
                      tabIndex={!disabled && date === activeDate ? 0 : -1}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={`${capitalize(formatDateLong(date))}${!loading && !error ? hasScreenings ? ', visningar finns' : ', inga visningar' : ''}`}
                      onClick={() => {
                        if (disabled) return
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
