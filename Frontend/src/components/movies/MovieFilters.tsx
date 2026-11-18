import { useCallback, useRef, useState, type Ref } from 'react'
import { useTranslation } from '../../context/LocaleContext'
import { FilterPillGroup, type FilterOption } from '../Pills'
import DatePickerPopover from '../DatePickerPopover'
import { formatDateLong, formatDateShort } from '../../utils/date'
import type { ScreeningProgramme } from '../../hooks/useScreeningProgramme'

export type MovieSort = 'popular' | 'title' | 'newest' | 'rating'

const SORT_OPTIONS = [
  { value: 'popular', labelKey: 'movies.sortPopular' },
  { value: 'title', labelKey: 'movies.sortTitle' },
  { value: 'newest', labelKey: 'movies.sortNewest' },
  { value: 'rating', labelKey: 'movies.sortRating' },
] as const satisfies readonly { value: MovieSort; labelKey: string }[]

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
  const { t, locale } = useTranslation()
  const datePickerButtonRef = useRef<HTMLButtonElement>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const closeDatePicker = useCallback(() => setIsDatePickerOpen(false), [])
  const customDate = date && !dateOptions.some(option => option.value === date) ? date : null

  const ageOptions: FilterOption[] = [
    { value: 'all', label: t('common.all') },
    { value: '0', label: t('movie.allAges') },
    { value: '7', label: t('movie.age', { age: 7 }) },
    { value: '11', label: t('movie.age', { age: 11 }) },
    { value: '15', label: t('movie.age', { age: 15 }) },
  ]

  return (
    <div className="movie-filters">
      <div className="d-flex gap-2 mb-3">
        <div className="movie-filters__search">
          <label htmlFor="movie-search" className="visually-hidden">
            {t('movies.searchLabel')}
          </label>
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            ref={inputRef}
            id="movie-search"
            type="search"
            className="form-control"
            placeholder={t('movies.searchPlaceholder')}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <label htmlFor="movie-sort" className="visually-hidden">
          {t('movies.sortLabel')}
        </label>
        <select
          id="movie-sort"
          className="form-select movie-filters__sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as MovieSort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <FilterPillGroup
        ariaLabel={t('movies.genreFilterLabel')}
        variant="genre"
        options={genreOptions}
        value={genre}
        onChange={onGenreChange}
        className="mb-2"
      />

      <div className="movie-filters__row mb-2">
        <span className="movie-filters__label" aria-hidden="true">
          {t('filter.ageLimit')}:
        </span>
        <FilterPillGroup
          ariaLabel={t('filter.ageLimit')}
          variant="age"
          options={ageOptions}
          value={age}
          onChange={onAgeChange}
        />
      </div>

      {date && (
        <div className="movie-filters__row">
          <span className="movie-filters__label" aria-hidden="true">
            {t('filter.date')}:
          </span>
          <FilterPillGroup ariaLabel={t('filter.date')} options={dateOptions} value={date} onChange={onDateChange} />
          <button
            ref={datePickerButtonRef}
            type="button"
            className={`filter-pill${customDate ? ' filter-pill--active' : ''}`}
            aria-pressed={customDate !== null}
            aria-haspopup="dialog"
            aria-expanded={isDatePickerOpen}
            aria-controls={isDatePickerOpen ? 'movies-date-picker-popover' : undefined}
            aria-label={customDate ? t('filter.selectedDateChange', { date: formatDateLong(customDate, locale) }) : t('calendar.chooseDate')}
            onClick={() => setIsDatePickerOpen(isOpen => !isOpen)}
          >
            <i className="bi bi-calendar3" aria-hidden="true" />
            {customDate && <span className="ms-2">{formatDateShort(customDate, locale)}</span>}
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
