import HeroSection, { HeroSectionSkeleton } from '../components/home/HeroSection'
import { useMovies } from '../hooks'
import './Home.scss'

export default function Home() {
  const { data: movies, loading: moviesLoading } = useMovies()

  // Feature the first movie that has a landscape still, falling back to the first movie
  const featuredMovie = movies?.find((movie) => movie.landscape_image_url) ?? movies?.[0] ?? null

  return (
    <div className="home-page">
      {moviesLoading && <HeroSectionSkeleton />}
      {!moviesLoading && featuredMovie && <HeroSection movie={featuredMovie} />}
    </div>
  )
}
