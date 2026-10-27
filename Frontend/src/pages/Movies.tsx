import { useState } from 'react'
import { useMovies, useScreenings } from '../hooks'
import type { Movie, Screening } from '../types'
import { MovieGridSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '../components/Tabs'
import MovieFilters, { type MovieSort } from '../components/movies/MovieFilters'
import MovieListCard from '../components/movies/MovieListCard'
import { addDaysToIsoDate, formatDayChipLabel, toCinemaIsoDate, todayIsoDate } from '../utils/date'
import { getAgeLimit } from '../utils/movie'

type MoviesTab = 'now' | 'upcoming'

const DAYS_SHOWN = 4

function compareMovies(a: Movie, b: Movie, sort: MovieSort, bookedSeats: Map<number, number>) {
  const ratingDiff = (b.imdb_rating ?? 0) - (a.imdb_rating ?? 0)

  switch (sort) {
    case 'title':
      return a.title.localeCompare(b.title, 'sv')
    case 'newest':
      return (b.release_date ?? '').localeCompare(a.release_date ?? '')
    case 'rating':
      return ratingDiff
    case 'popular':
      // Most booked seats first, then rating
      return (bookedSeats.get(b.id) ?? 0) - (bookedSeats.get(a.id) ?? 0) || ratingDiff
  }
}

function isUpcoming(movie: Movie, today: string): boolean {
  return movie.release_date !== null && toCinemaIsoDate(movie.release_date) > today
}

function matchesSearch(movie: Movie, search: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true
  return [movie.title, movie.director ?? '', ...movie.genres].some((text) =>
    text.toLowerCase().includes(query),
  )
}

export default function Movies() {
  const today = todayIsoDate()
  const [tab, setTab] = useState<MoviesTab>('now')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<MovieSort>('popular')
  const [genre, setGenre] = useState('all')
  const [age, setAge] = useState('all')
  const [date, setDate] = useState(today)

  const { data: movies, loading, error, refetch } = useMovies()
  const { data: screenings } = useScreenings({ date })

  const allMovies = movies ?? []
  const nowShowing = allMovies.filter((movie) => !isUpcoming(movie, today))
  const upcoming = allMovies.filter((movie) => isUpcoming(movie, today))
  const tabMovies = tab === 'now' ? nowShowing : upcoming

  const genres = [...new Set(tabMovies.flatMap((movie) => movie.genres))].sort((a, b) =>
    a.localeCompare(b, 'sv'),
  )
  const genreOptions = [
    { value: 'all', label: 'Alla' },
    ...genres.map((name) => ({ value: name, label: name })),
  ]

  const dateOptions = Array.from({ length: DAYS_SHOWN }, (_, index) => {
    const isoDate = addDaysToIsoDate(today, index)
    return { value: isoDate, label: formatDayChipLabel(isoDate) }
  })

  const screeningsByMovie = new Map<number, Screening[]>()
  const bookedSeats = new Map<number, number>()
  for (const screening of screenings ?? []) {
    const { movieId } = screening
    screeningsByMovie.set(movieId, [...(screeningsByMovie.get(movieId) ?? []), screening])
    bookedSeats.set(movieId, (bookedSeats.get(movieId) ?? 0) + (screening.bookedSeats ?? 0))
  }

  const filteredMovies = tabMovies
    .filter((movie) => genre === 'all' || movie.genres.includes(genre))
    .filter((movie) => age === 'all' || getAgeLimit(movie.age_rating) <= Number(age))
    .filter((movie) => tab === 'upcoming' || screeningsByMovie.has(movie.id))
    .filter((movie) => matchesSearch(movie, search))
    .sort((a, b) => compareMovies(a, b, sort, bookedSeats))

  const hasActiveFilters = search !== '' || genre !== 'all' || age !== 'all'

  function changeTab(nextTab: string) {
    setTab(nextTab as MoviesTab)
    setGenre('all')
  }

  function clearFilters() {
    setSearch('')
    setGenre('all')
    setAge('all')
  }

  return (
    <Tabs value={tab} onChange={changeTab}>
      <header className="movies-header full-bleed px-3 px-md-5">
        <div className="container movies-container">
          <h1 className="movies-header__title">Filmer &amp; Repertoar</h1>
          <p className="movies-header__subtitle">
            Vad vill du se?
            {!loading &&
              ` Vi spelar nu ${nowShowing.length} ${nowShowing.length === 1 ? 'film' : 'filmer'} på FILMVISARNA.`}
          </p>

          <TabsList ariaLabel="Filmer">
            <TabsTrigger value="now">På bio nu</TabsTrigger>
            <TabsTrigger
              value="upcoming"
              badge={
                <span className="movies-header__count">
                  {upcoming.length}
                  <span className="visually-hidden"> filmer</span>
                </span>
              }
            >
              Kommande premiärer
            </TabsTrigger>
          </TabsList>
        </div>
      </header>

      <TabsPanel value={tab} className="container movies-container py-4">
        <MovieFilters
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          genre={genre}
          genreOptions={genreOptions}
          onGenreChange={setGenre}
          age={age}
          onAgeChange={setAge}
          date={tab === 'now' ? date : null}
          dateOptions={dateOptions}
          onDateChange={setDate}
        />

        <div className="pt-4">
          {loading && <MovieGridSkeleton count={10} />}

          {error && (
            <EmptyState
              variant="error"
              title="Kunde inte ladda filmer"
              description={error}
              actionLabel="Försök igen"
              onAction={refetch}
            />
          )}

          {!loading && !error && (
            <p className="movies-results__count" role="status">
              Visar <strong>{filteredMovies.length}</strong> av {tabMovies.length}{' '}
              {tabMovies.length === 1 ? 'film' : 'filmer'}
            </p>
          )}

          {!loading && !error && filteredMovies.length === 0 && (
            <EmptyState
              variant="empty"
              title="Inga filmer hittades"
              description={
                hasActiveFilters
                  ? 'Inga filmer matchar dina valda filter. Prova att återställa filtreringen.'
                  : 'Det finns inga filmer att visa här just nu.'
              }
              actionLabel={hasActiveFilters ? 'Rensa filter' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          )}

          {!loading && !error && filteredMovies.length > 0 && (
            <ul className="list-unstyled row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3 mb-0">
              {filteredMovies.map((movie) => (
                <li key={movie.id} className="col">
                  <MovieListCard
                    movie={movie}
                    screenings={screeningsByMovie.get(movie.id) ?? []}
                    dayLabel={tab === 'now' ? formatDayChipLabel(date) : null}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </TabsPanel>
    </Tabs>
  )
}
