import { useState } from 'react'
import FilterStrip, { type AgeFilter, type DateFilter } from '../components/home/FilterStrip'
import HeroSection, { HeroSectionSkeleton } from '../components/home/HeroSection'
import RepertoireSection from '../components/home/RepertoireSection'
import { useMovies, useScreenings } from '../hooks'
import type { ScreeningWhen } from '../types'
import { capitalize, formatDateLong } from '../utils/date'
import './Home.scss'

const DATE_PRESET_HEADINGS: Record<ScreeningWhen, string> = {
  today: 'Idag',
  tomorrow: 'Imorgon',
  weekend: 'I helgen',
}

function getDateHeading(filter: DateFilter): string {
  return filter.kind === 'preset'
    ? DATE_PRESET_HEADINGS[filter.when]
    : capitalize(formatDateLong(filter.date))
}

export default function Home() {
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: 'preset', when: 'today' })
  const [ageFilter, setAgeFilter] = useState<AgeFilter>(null)

  const { data: movies, loading: moviesLoading, error: moviesError } = useMovies()
  const {
    data: screenings,
    loading: screeningsLoading,
    error: screeningsError,
  } = useScreenings({
    when: dateFilter.kind === 'preset' ? dateFilter.when : undefined,
    date: dateFilter.kind === 'date' ? dateFilter.date : undefined,
    age: ageFilter ?? undefined,
  })

  // Use the first movie with a landscape image in the hero
  const featuredMovie = movies?.find((movie) => movie.landscape_image_url) ?? movies?.[0] ?? null

  return (
    <div className="home-page">
      {moviesLoading && <HeroSectionSkeleton />}
      {!moviesLoading && featuredMovie && <HeroSection movie={featuredMovie} />}

      <FilterStrip
        dateFilter={dateFilter}
        ageFilter={ageFilter}
        onDateFilterChange={setDateFilter}
        onAgeFilterChange={setAgeFilter}
      />

      <RepertoireSection
        heading={`Repertoar — ${getDateHeading(dateFilter)}`}
        movies={movies ?? []}
        screenings={screenings ?? []}
        loading={moviesLoading || screeningsLoading}
        error={moviesError ?? screeningsError}
      />
    </div>
  )
}
