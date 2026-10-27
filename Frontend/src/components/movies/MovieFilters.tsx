import { FilterPillGroup, type FilterOption } from '../Pills'

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
  return (
    <div className="movie-filters">
      <div className="d-flex gap-2 mb-3">
        <div className="movie-filters__search">
          <label htmlFor="movie-search" className="visually-hidden">
            Sök film eller genre
          </label>
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
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
        </div>
      )}
    </div>
  )
}
