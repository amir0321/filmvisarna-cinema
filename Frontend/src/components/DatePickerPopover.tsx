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
import './DatePickerPopover.scss'

interface DatePickerPopoverProps {
  id: string
  anchorRef: RefObject<HTMLElement | null>
  selectedDate: string | null
  minDate: string
  maxDate: string
  onSelect: (isoDate: string) => void
  onClose: () => void
}

const WEEKDAYS = [
  { short: 'Mån', long: 'måndag' },
  { short: 'Tis', long: 'tisdag' },
  { short: 'Ons', long: 'onsdag' },
  { short: 'Tor', long: 'torsdag' },
  { short: 'Fre', long: 'fredag' },
  { short: 'Lör', long: 'lördag' },
  { short: 'Sön', long: 'söndag' },
]

const VIEWPORT_MARGIN = 8
const ANCHOR_GAP = 8

function clampDate(isoDate: string, min: string, max: string): string {
  if (isoDate < min) return min
  if (isoDate > max) return max
  return isoDate
}

// Calendar dates for the month, padded with nulls so the 1st lands on the right weekday
function buildMonthWeeks(monthStart: string): (string | null)[][] {
  const cells: (string | null)[] = Array(weekdayIndex(monthStart)).fill(null)
  for (let day = 0; day < daysInMonth(monthStart); day++) {
    cells.push(addDaysToIsoDate(monthStart, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Mount only while open. Uses position: fixed and follows the anchor on scroll/resize,
// which also lets it escape the horizontally scrolling filter row without being clipped.
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
  const shouldFocusDayRef = useRef(true)
  const today = todayIsoDate()
  const [focusedDate, setFocusedDate] = useState(() =>
    clampDate(selectedDate ?? today, minDate, maxDate),
  )

  const monthStart = startOfMonthIsoDate(focusedDate)
  const canGoToPreviousMonth = monthStart > startOfMonthIsoDate(minDate)
  const canGoToNextMonth = monthStart < startOfMonthIsoDate(maxDate)

  // Keep the popover attached to the button. Writes styles directly to avoid re-rendering on every scroll.
  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current
      const popover = popoverRef.current
      if (!anchor || !popover) return

      const rect = anchor.getBoundingClientRect()
      const maxLeft = window.innerWidth - popover.offsetWidth - VIEWPORT_MARGIN
      popover.style.top = `${rect.bottom + ANCHOR_GAP}px`
      popover.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft))}px`
    }

    updatePosition()
    // Capture phase also catches scrolling inside the filter row, not only the page
    window.addEventListener('scroll', updatePosition, { capture: true, passive: true })
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true })
      window.removeEventListener('resize', updatePosition)
    }
  }, [anchorRef])

  // Close when clicking outside the popover and its button
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [anchorRef, onClose])

  // Move keyboard focus to the active day (on open and after arrow-key navigation)
  useEffect(() => {
    if (!shouldFocusDayRef.current) return
    shouldFocusDayRef.current = false
    popoverRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedDate}"]`)?.focus()
  }, [focusedDate])

  function closeAndReturnFocus() {
    onClose()
    anchorRef.current?.focus()
  }

  function moveFocus(nextDate: string) {
    shouldFocusDayRef.current = true
    setFocusedDate(clampDate(nextDate, minDate, maxDate))
  }

  function handleGridKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    const keyMoves: Record<string, () => string> = {
      ArrowLeft: () => addDaysToIsoDate(focusedDate, -1),
      ArrowRight: () => addDaysToIsoDate(focusedDate, 1),
      ArrowUp: () => addDaysToIsoDate(focusedDate, -7),
      ArrowDown: () => addDaysToIsoDate(focusedDate, 7),
      Home: () => addDaysToIsoDate(focusedDate, -weekdayIndex(focusedDate)),
      End: () => addDaysToIsoDate(focusedDate, 6 - weekdayIndex(focusedDate)),
      PageUp: () => addMonthsToIsoDate(focusedDate, -1),
      PageDown: () => addMonthsToIsoDate(focusedDate, 1),
    }

    const move = keyMoves[event.key]
    if (!move) return
    event.preventDefault()
    moveFocus(move())
  }

  return (
    <div
      ref={popoverRef}
      id={id}
      role="dialog"
      aria-label="Välj datum"
      className="date-picker-popover"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          closeAndReturnFocus()
        }
      }}
      onBlur={(event) => {
        // Close when keyboard focus leaves the popover (e.g. tabbing past it)
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
          disabled={!canGoToPreviousMonth}
          onClick={() => setFocusedDate(clampDate(addMonthsToIsoDate(focusedDate, -1), minDate, maxDate))}
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
          disabled={!canGoToNextMonth}
          onClick={() => setFocusedDate(clampDate(addMonthsToIsoDate(focusedDate, 1), minDate, maxDate))}
        >
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>

      <table className="date-picker-popover__grid" onKeyDown={handleGridKeyDown}>
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th key={weekday.short} scope="col" abbr={weekday.long}>
                {weekday.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buildMonthWeeks(monthStart).map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((date, dayIndex) => {
                if (!date) return <td key={dayIndex}></td>

                const isDisabled = date < minDate || date > maxDate
                const isSelected = date === selectedDate
                const isToday = date === today

                return (
                  <td key={date}>
                    <button
                      type="button"
                      data-date={date}
                      className={[
                        'date-picker-popover__day',
                        isSelected && 'date-picker-popover__day--selected',
                        isToday && 'date-picker-popover__day--today',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      // Roving tabindex: only one day is in the tab order, arrows move between days
                      tabIndex={date === focusedDate ? 0 : -1}
                      disabled={isDisabled}
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
