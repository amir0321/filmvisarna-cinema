import { useSearchParams } from 'react-router'
import FilterStrip from '../components/home/FilterStrip'
import HeroSection, { HeroSectionSkeleton } from '../components/home/HeroSection'
import RepertoireSection from '../components/home/RepertoireSection'
import { useTranslation, type Locale } from '../context/LocaleContext'
import { useMovies } from '../hooks'
import { useScreeningProgramme } from '../hooks/useScreeningProgramme'
import type { Translator } from '../i18n'
import type { ScreeningWhen } from '../types'
import { capitalize, formatDateLong, toCinemaIsoDate } from '../utils/date'
import { getAgeLimit } from '../utils/movie'
import { getDateFilterRange, readAgeFilter, readHomeDateFilter, setAgeFilter, setDateFilter, type DateFilter } from '../utils/movieFilters'

const HERO_MOVIE_COUNT = 5

const DATE_PRESET_HEADINGS = {
  today: 'date.today',
  tomorrow: 'date.tomorrow',
  weekend: 'date.weekend',
} as const satisfies Record<ScreeningWhen, string>

function getDateHeading(filter: DateFilter, t: Translator, locale: Locale): string {
  return filter.kind === 'preset'
    ? t(DATE_PRESET_HEADINGS[filter.when])
    : capitalize(formatDateLong(filter.date, locale))
}

export default function Home() {
  const { t, locale } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const programme = useScreeningProgramme()
  const dateFilter = readHomeDateFilter(searchParams, programme.today, programme.dates)
  const ageFilter = readAgeFilter(searchParams)

  const { data: movies, loading: moviesLoading, error: moviesError, refetch: refetchMovies } = useMovies()
  const { from, to } = getDateFilterRange(dateFilter, programme.today)
  const screenings = programme.screenings.filter(screening => {
    const date = toCinemaIsoDate(screening.startsAt)
    return date >= from && date <= to && (ageFilter === null || (screening.ageLimit ?? getAgeLimit(screening.ageRating ?? null)) <= ageFilter)
  })

  const moviesWithImage = (movies ?? []).filter((movie) => movie.landscape_image_url)
  const heroMovies = (moviesWithImage.length > 0 ? moviesWithImage : (movies ?? [])).slice(0, HERO_MOVIE_COUNT)

  return (
    <div className="full-bleed">
      {moviesLoading && <HeroSectionSkeleton />}
      {!moviesLoading && heroMovies.length > 0 && <HeroSection movies={heroMovies} />}

      <FilterStrip
        programme={programme}
        dateFilter={dateFilter}
        ageFilter={ageFilter}
        onDateFilterChange={(filter) => setSearchParams((previous) => setDateFilter(previous, filter))}
        onAgeFilterChange={(age) => setSearchParams((previous) => setAgeFilter(previous, age))}
      />

      <RepertoireSection
        key={`${dateFilter.kind === 'preset' ? dateFilter.when : dateFilter.date}:${ageFilter ?? 'all'}`}
        heading={t('home.repertoireHeading', { date: getDateHeading(dateFilter, t, locale) })}
        movies={movies ?? []}
        screenings={screenings}
        loading={moviesLoading || programme.loading}
        error={moviesError ?? programme.error}
        onRetry={() => { void refetchMovies(); void programme.refetch() }}
      />
    </div>
  )
}
