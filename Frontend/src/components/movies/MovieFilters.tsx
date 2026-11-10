import { useCallback, useRef, useState, type Ref } from 'react'
import { FilterPillGroup, type FilterOption } from '../Pills'
import DatePickerPopover from '../DatePickerPopover'
import { formatDateLong, formatDateShort } from '../../utils/date'
import type { ScreeningProgramme } from '../../hooks/useScreeningProgramme'

export type MovieSort = 'popular' | 'title' | 'newest' | 'rating'

const SORT_OPTIONS: { value: MovieSort; label: string }[] = [
  { value: 'popular', label: 'Mest populär' },
  { value: 'title', label: 'A–Ö' },
  { value: 'newest', label: 'Senast' },
  { value: 'rating', label: 'Högst betyg' },
]

const AGE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Alla' },
  { value: '0', label: 'Barntillåten' },
  { value: '7', label: '7 år' },
  { value: '11', label: '11 år' },
  { value: '15', label: '15 år' },
]

interface MovieFiltersProps {
  programme: ScreeningProgramme
  inputRef?: Ref<HTMLInputElement>
  search: string
  onSearchChange: (search: string) => void
  sort: MovieSort
  onSortChange: (sort: MovieSort) => void
  genre: string
  genreOptions: FilterOption[]
  onGenreChange: (genre: string) => void
  age: string
  onAgeChange: (age: string) => void
  date: string | null
  dateOptions: FilterOption[]
  onDateChange: (date: string) => void
}

export default function MovieFilters({
  programme,
  inputRef,
  search,
  onSearchChange,
  sort,
  onSortChange,
  genre,
  genreOptions,
  onGenreChange,
  age,
  onAgeChange,
  date,
  dateOptions,
  onDateChange,
}: MovieFiltersProps) {
  const datePickerButtonRef = useRef<HTMLButtonElement>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const closeDatePicker = useCallback(() => setIsDatePickerOpen(false), [])
  const customDate = date && !dateOptions.some(option => option.value === date) ? date : null

  return (
    <div className="movie-filters">
      <div className="d-flex gap-2 mb-3">
        <div className="movie-filters__search">
          <label htmlFor="movie-search" className="visually-hidden">
            Sök film eller genre
          </label>
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            ref={inputRef}
            id="movie-search"
            type="search"
            className="form-control"
            placeholder="Sök film eller genre..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <label htmlFor="movie-sort" className="visually-hidden">
          Sortera filmer
        </label>
        <select
          id="movie-sort"
          className="form-select movie-filters__sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as MovieSort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <FilterPillGroup
        ariaLabel="Genre"
        variant="genre"
        options={genreOptions}
        value={genre}
        onChange={onGenreChange}
        className="mb-2"
      />

      <div className="movie-filters__row mb-2">
        <span className="movie-filters__label" aria-hidden="true">
          Åldersgräns:
        </span>
        <FilterPillGroup
          ariaLabel="Åldersgräns"
          variant="age"
          options={AGE_OPTIONS}
          value={age}
          onChange={onAgeChange}
        />
      </div>

      {date && (
        <div className="movie-filters__row">
          <span className="movie-filters__label" aria-hidden="true">
            Datum:
          </span>
          <FilterPillGroup ariaLabel="Datum" options={dateOptions} value={date} onChange={onDateChange} />
          <button
            ref={datePickerButtonRef}
            type="button"
            className={`filter-pill${customDate ? ' filter-pill--active' : ''}`}
            aria-pressed={customDate !== null}
            aria-haspopup="dialog"
            aria-expanded={isDatePickerOpen}
            aria-controls={isDatePickerOpen ? 'movies-date-picker-popover' : undefined}
            aria-label={customDate ? `Valt datum: ${formatDateLong(customDate)}. Byt datum` : 'Välj datum'}
            onClick={() => setIsDatePickerOpen(isOpen => !isOpen)}
          >
            <i className="bi bi-calendar3" aria-hidden="true" />
            {customDate && <span className="ms-2">{formatDateShort(customDate)}</span>}
          </button>
          {isDatePickerOpen && (
            <DatePickerPopover
              id="movies-date-picker-popover"
              anchorRef={datePickerButtonRef}
              selectedDate={date}
              minDate={programme.today}
              maxDate={programme.maxDate}
              programme={programme}
              onSelect={onDateChange}
              onClose={closeDatePicker}
            />
          )}
        </div>
      )}
    </div>
  )
}
