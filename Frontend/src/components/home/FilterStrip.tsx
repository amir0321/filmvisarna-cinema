import { useCallback, useRef, useState } from 'react'
import type { ScreeningWhen } from '../../types'
import { addDaysToIsoDate, formatDateLong, formatDateShort, todayIsoDate } from '../../utils/date'
import DatePickerPopover from '../DatePickerPopover'
import './FilterStrip.scss'

export type DateFilter = { kind: 'preset'; when: ScreeningWhen } | { kind: 'date'; date: string }

// null = no age filter ("Alla")
export type AgeFilter = number | null

interface FilterStripProps {
  dateFilter: DateFilter
  ageFilter: AgeFilter
  onDateFilterChange: (filter: DateFilter) => void
  onAgeFilterChange: (filter: AgeFilter) => void
}

const DATE_PRESETS: { when: ScreeningWhen; label: string }[] = [
  { when: 'today', label: 'Idag' },
  { when: 'tomorrow', label: 'Imorgon' },
  { when: 'weekend', label: 'I helgen' },
]

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: null, label: 'Alla' },
  { value: 0, label: 'Barntillåten' },
  { value: 7, label: '7 år' },
  { value: 11, label: '11 år' },
  { value: 15, label: '15 år' },
]

// How far ahead the calendar lets visitors pick a date
const MAX_DAYS_AHEAD = 60

function pillClassName(isActive: boolean): string {
  return `filter-pill${isActive ? ' filter-pill--active' : ''}`
}

// The checkmark shows the selected filter without relying on colour alone
function ActiveCheck({ isActive }: { isActive: boolean }) {
  return isActive ? <i className="bi bi-check2 me-1" aria-hidden="true"></i> : null
}

export default function FilterStrip({
  dateFilter,
  ageFilter,
  onDateFilterChange,
  onAgeFilterChange,
}: FilterStripProps) {
  const datePickerButtonRef = useRef<HTMLButtonElement>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const closeDatePicker = useCallback(() => setIsDatePickerOpen(false), [])
  const today = todayIsoDate()
  const customDate = dateFilter.kind === 'date' ? dateFilter.date : null

  return (
    <div className="filter-strip">
      <div className="container home-container d-flex flex-column flex-md-row flex-md-wrap gap-2 gap-md-4 py-3">
        <div
          role="group"
          aria-labelledby="date-filter-label"
          className="filter-strip__group"
        >
          <span id="date-filter-label" className="filter-strip__label">
            Datum
          </span>
          {DATE_PRESETS.map((preset) => {
            const isActive = dateFilter.kind === 'preset' && dateFilter.when === preset.when
            return (
              <button
                key={preset.when}
                type="button"
                className={pillClassName(isActive)}
                aria-pressed={isActive}
                onClick={() => onDateFilterChange({ kind: 'preset', when: preset.when })}
              >
                <ActiveCheck isActive={isActive} />
                {preset.label}
              </button>
            )
          })}

          <button
            ref={datePickerButtonRef}
            type="button"
            className={pillClassName(customDate !== null)}
            aria-pressed={customDate !== null}
            aria-haspopup="dialog"
            aria-expanded={isDatePickerOpen}
            aria-controls={isDatePickerOpen ? 'date-picker-popover' : undefined}
            aria-label={customDate ? `Valt datum: ${formatDateLong(customDate)}. Byt datum` : 'Välj datum'}
            onClick={() => setIsDatePickerOpen((isOpen) => !isOpen)}
          >
            <i className="bi bi-calendar3" aria-hidden="true"></i>
            {customDate && <span className="ms-2">{formatDateShort(customDate)}</span>}
          </button>
          {isDatePickerOpen && (
            <DatePickerPopover
              id="date-picker-popover"
              anchorRef={datePickerButtonRef}
              selectedDate={customDate}
              minDate={today}
              maxDate={addDaysToIsoDate(today, MAX_DAYS_AHEAD)}
              onSelect={(date) => onDateFilterChange({ kind: 'date', date })}
              onClose={closeDatePicker}
            />
          )}
        </div>

        <span className="filter-strip__divider d-none d-md-block" aria-hidden="true"></span>

        <div
          role="group"
          aria-labelledby="age-filter-label"
          className="filter-strip__group"
        >
          <span id="age-filter-label" className="filter-strip__label">
            Åldersgräns
          </span>
          {AGE_OPTIONS.map((option) => {
            const isActive = ageFilter === option.value
            return (
              <button
                key={option.label}
                type="button"
                className={pillClassName(isActive)}
                aria-pressed={isActive}
                onClick={() => onAgeFilterChange(option.value)}
              >
                <ActiveCheck isActive={isActive} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
