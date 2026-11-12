import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { deleteMovie } from '../../api/movies'
import { EmptyState } from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import { CardListSkeleton } from '../../components/Skeleton'
import { InlineFeedback } from '../../components/Toast'
import MoviesTable from '../../components/admin/MoviesTable'
import { useMovies } from '../../hooks/useMovies'
import { usePagination } from '../../hooks/usePagination'
import type { Movie } from '../../types/movie'

const MovieFormModal = lazy(() => import('../../components/admin/MovieFormModal'))

export default function AdminMovies() {
  const { data: movies, loading, error, refetch, setData } = useMovies()
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const search = query.trim().toLocaleLowerCase('sv-SE')
  const filteredMovies = (movies ?? []).filter(movie => movie.title.toLocaleLowerCase('sv-SE').includes(search)
    || (movie.director ?? '').toLocaleLowerCase('sv-SE').includes(search))
  const { page, totalPages, pageItems, setPage, totalItems } = usePagination(filteredMovies, 10)

  function openForm(movie: Movie | null) {
    setEditingMovie(movie)
    setFormOpen(true)
    setFeedback(null)
  }

  function handleSaved(movie: Movie) {
    setData(current => [...(current ?? []).filter(item => item.id !== movie.id), movie]
      .sort((a, b) => a.title.localeCompare(b.title, 'sv-SE')))
    setFeedback(`Sparad! ${movie.title}`)
  }

  async function handleDelete(movie: Movie) {
    await deleteMovie(movie.id)
    setData(current => current?.filter(item => item.id !== movie.id) ?? [])
    setFeedback(`${movie.title} har tagits bort.`)
  }

  return (
    <div className="admin-movies">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Filmarkiv</h1>
          <p className="admin-page-header__subtitle">Lägg till filmer, granska filmuppgifter och hantera rollistor.</p>
        </div>
        <nav aria-label="Brödsmulor"><ol className="admin-breadcrumb"><li><Link to="/admin">Backoffice</Link></li><li aria-current="page">Filmarkiv</li></ol></nav>
      </header>

      <div className="admin-toolbar">
        <div className="admin-movies__search">
          <label htmlFor="admin-movies-search" className="visually-hidden">Sök efter filmtitel eller regissör</label>
          <i className="bi bi-search" aria-hidden="true" />
          <input id="admin-movies-search" type="search" className="form-control" placeholder="Sök efter filmtitel eller regissör" maxLength={300} value={query}
            onChange={event => { setQuery(event.target.value); setPage(1) }} />
        </div>
        <button type="button" className="btn btn-danger admin-toolbar__create" onClick={() => openForm(null)}><i className="bi bi-plus-lg me-2" aria-hidden="true" />Lägg till film</button>
      </div>

      {feedback ? <InlineFeedback variant="success" message={feedback} className="mb-3" /> : null}
      {loading ? <CardListSkeleton count={4} /> : null}
      {error ? <EmptyState variant="error" title="Kunde inte ladda filmer" description="Det gick inte att hämta filmarkivet. Kontrollera anslutningen och försök igen." actionLabel="Försök igen" onAction={() => void refetch()} /> : null}
      {!loading && !error ? <>
        <p className="admin-movies__count" role="status">{totalItems} {totalItems === 1 ? 'film' : 'filmer'}</p>
        {totalItems > 0 ? <>
          <MoviesTable movies={pageItems} onEdit={openForm} onDelete={handleDelete} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-3" ariaLabel="Sidnumrering för filmer" />
        </> : <EmptyState title={search ? 'Inga filmer matchar sökningen' : 'Inga filmer i arkivet'}
          description={search ? 'Prova en annan filmtitel eller regissör.' : 'Lägg till en film manuellt eller hämta uppgifter från TMDB.'}
          actionLabel={search ? 'Rensa sökningen' : 'Lägg till film'} onAction={() => search ? setQuery('') : openForm(null)} />}
      </> : null}
      {formOpen ? <Suspense fallback={<p role="status">Öppnar filmformuläret…</p>}>
        <MovieFormModal key={editingMovie?.id ?? 'new'} movie={editingMovie} onClose={() => { setFormOpen(false); void refetch() }} onSaved={handleSaved} />
      </Suspense> : null}
    </div>
  )
}
