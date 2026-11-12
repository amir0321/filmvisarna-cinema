import { useState } from 'react'
import { Link } from 'react-router'
import apiClient from '../../api/client'
import { useAdminMenuItems } from '../../hooks'
import type { AdminMenuItem } from '../../types'
import { EmptyState } from '../../components/EmptyState'
import { FilterPillGroup } from '../../components/Pills'
import { CardListSkeleton } from '../../components/Skeleton'
import { InlineFeedback, type InlineFeedbackVariant } from '../../components/Toast'
import KioskItemFormModal from '../../components/admin/KioskItemFormModal'
import AdminStatCard from '../../components/admin/AdminStatCard'
import KioskTable from '../../components/admin/KioskTable'
import { KIOSK_CATEGORIES, getKioskCategory, type KioskCategory } from '../../utils/kiosk'

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Alla' },
  ...Object.entries(KIOSK_CATEGORIES).map(([value, { label }]) => ({ value, label })),
]

export default function AdminKiosk() {
  const { data, loading, error, refetch, setData } = useAdminMenuItems()
  const items = data ?? []
  const activeCount = items.filter((item) => item.isAvailable).length
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<KioskCategory | 'all'>('all')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ variant: InlineFeedbackVariant; message: string } | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null)

  const query = search.trim().toLowerCase()
  const filteredItems = items
    .filter((item) => category === 'all' || getKioskCategory(item) === category)
    .filter((item) => `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query))

  async function toggleAvailable(item: AdminMenuItem) {
    setSavingId(item.id)
    setFeedback(null)
    try {
      const updated = await apiClient.patch<AdminMenuItem>(`/admin/menu-items/${item.id}`, {
        isAvailable: !item.isAvailable,
      })
      // Swap in the saved row instead of reloading the whole list
      setData((current) => current?.map((row) => (row.id === updated.id ? updated : row)) ?? null)
    } catch (err) {
      setFeedback({
        variant: 'danger',
        message: err instanceof Error ? err.message : 'Det gick inte att spara ändringen.',
      })
    } finally {
      setSavingId(null)
    }
  }

  function openForm(item: AdminMenuItem | null) {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  async function handleSaved(message: string) {
    setIsFormOpen(false)
    setFeedback({ variant: 'success', message })
    await refetch()
  }

  return (
    <div className="admin-kiosk">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-header__title">Kiosksortiment</h1>
          <p className="admin-page-header__subtitle">Hantera kioskprodukter, priser och tillgänglighet</p>
        </div>
        <nav aria-label="Brödsmulor">
          <ol className="admin-breadcrumb">
            <li>
              <Link to="/admin">Backoffice</Link>
            </li>
            <li aria-current="page">Kiosksortiment</li>
          </ol>
        </nav>
      </header>

      <div className="admin-stats">
        <AdminStatCard label="Totalt sortiment" value={`${items.length} st`} color="info" />
        <AdminStatCard label="Aktiva produkter" value={`${activeCount} st`} color="success" />
        <AdminStatCard label="Inaktiva produkter" value={`${items.length - activeCount} st`} color="warning" />
      </div>

      <div className="admin-kiosk__search-row">
        <div className="admin-search">
          <label htmlFor="kiosk-search" className="visually-hidden">
            Sök produkt
          </label>
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            id="kiosk-search"
            type="search"
            className="form-control"
            placeholder="Sök på produktnamn eller beskrivning..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="btn btn-danger admin-toolbar__create" onClick={() => openForm(null)}>
          <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
          Lägg till ny produkt
        </button>
      </div>

      <FilterPillGroup
        ariaLabel="Kategori"
        variant="genre"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={(value) => setCategory(value as KioskCategory | 'all')}
        className="mb-4"
      />

      {feedback && <InlineFeedback variant={feedback.variant} message={feedback.message} className="mb-3" />}

      {loading && <CardListSkeleton count={4} />}

      {error && (
        <EmptyState
          variant="error"
          title="Kunde inte ladda produkter"
          description={error}
          actionLabel="Försök igen"
          onAction={refetch}
        />
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <EmptyState icon="bi-search" title="Inga produkter" description="Inga produkter matchar din sökning." />
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <KioskTable
          items={filteredItems}
          savingId={savingId}
          onEdit={openForm}
          onToggleAvailable={toggleAvailable}
        />
      )}

      {isFormOpen && (
        <KioskItemFormModal item={editingItem} onClose={() => setIsFormOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
