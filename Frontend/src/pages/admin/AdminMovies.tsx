import { getIntlLocale } from '../../utils/locale'
import { useTranslation } from '../../context/LocaleContext'
import { lazy, Suspense, useState } from 'react'
import { deleteMovie } from '../../api/movies'
import { EmptyState } from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import { CardListSkeleton } from '../../components/Skeleton'
import { InlineFeedback } from '../../components/Toast'
import MoviesTable from '../../components/admin/MoviesTable'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useMovies } from '../../hooks/useMovies'
import { usePagination } from '../../hooks/usePagination'
import type { Movie } from '../../types/movie'

const MovieFormModal = lazy(() => import('../../components/admin/MovieFormModal'))

export default function AdminMovies() {
  const { t, locale } = useTranslation()
  const { data: movies, loading, error, refetch, setData } = useMovies()
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'saved' | 'deleted'; title: string } | null>(null)
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
      .sort((a, b) => a.title.localeCompare(b.title, getIntlLocale(locale))))
    setFeedback({ kind: 'saved', title: movie.title })
  }

  async function handleDelete(movie: Movie) {
    await deleteMovie(movie.id)
    setData(current => current?.filter(item => item.id !== movie.id) ?? [])
    setFeedback({ kind: 'deleted', title: movie.title })
  }

  return (
    <div className="admin-movies">
      <AdminPageHeader title={t('nav.movieArchive')} subtitle={t('admin.movies.subtitle')} />

      <div className="admin-toolbar">
        <div className="admin-movies__search">
          <label htmlFor="admin-movies-search" className="visually-hidden">{t('admin.movies.search')}</label>
          <i className="bi bi-search" aria-hidden="true" />
          <input id="admin-movies-search" type="search" className="form-control" placeholder={t('admin.movies.search')} maxLength={300} value={query}
            onChange={event => { setQuery(event.target.value); setPage(1) }} />
        </div>
        <button type="button" className="btn btn-danger admin-toolbar__create" onClick={() => openForm(null)}><i className="bi bi-plus-lg me-2" aria-hidden="true" />{t('admin.movies.add')}</button>
      </div>

      {feedback ? <InlineFeedback variant="success" message={t(feedback.kind === 'saved' ? 'admin.movies.savedTitle' : 'admin.movies.deletedTitle', { title: feedback.title })} className="mb-3" /> : null}
      {loading ? <CardListSkeleton count={4} /> : null}
      {error ? <EmptyState variant="error" title={t('movies.loadErrorTitle')} description={t('admin.movies.errorDescription')} actionLabel={t('common.retry')} onAction={() => void refetch()} /> : null}
      {!loading && !error ? <>
        <p className="admin-movies__count" role="status">{t(totalItems === 1 ? 'admin.movies.countOne' : 'admin.movies.countMany', { count: totalItems })}</p>
        {totalItems > 0 ? <>
          <MoviesTable movies={pageItems} onEdit={openForm} onDelete={handleDelete} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-3" ariaLabel={t('movies.paginationLabel')} />
        </> : <EmptyState title={search ? t('admin.movies.emptySearch') : t('admin.movies.emptyArchive')}
          description={search ? t('admin.movies.trySearch') : t('admin.movies.addHint')}
          actionLabel={search ? t('admin.movies.clearSearch') : t('admin.movies.add')} onAction={() => search ? setQuery('') : openForm(null)} />}
      </> : null}
      {formOpen ? <Suspense fallback={<p role="status">{t('admin.movies.openingForm')}</p>}>
        <MovieFormModal key={editingMovie?.id ?? 'new'} movie={editingMovie} onClose={() => { setFormOpen(false); void refetch() }} onSaved={handleSaved} />
      </Suspense> : null}
    </div>
  )
}
