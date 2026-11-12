import { useState } from 'react'
import { Link } from 'react-router'
import apiClient from '../../api/client'
import { useAdminMenuItems } from '../../hooks'
import type { AdminMenuItem } from '../../types'
import { EmptyState } from '../../components/EmptyState'
import { FilterPillGroup } from '../../components/Pills'
import { CardListSkeleton } from '../../components/Skeleton'
import { InlineFeedback } from '../../components/Toast'
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
  const [saveError, setSaveError] = useState<string | null>(null)

  const query = search.trim().toLowerCase()
  const filteredItems = items
    .filter((item) => category === 'all' || getKioskCategory(item) === category)
    .filter((item) => `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query))

  async function toggleAvailable(item: AdminMenuItem) {
    setSavingId(item.id)
    setSaveError(null)
    try {
      const updated = await apiClient.patch<AdminMenuItem>(`/admin/menu-items/${item.id}`, {
        isAvailable: !item.isAvailable,
      })
      // Swap in the saved row instead of reloading the whole list
      setData((current) => current?.map((row) => (row.id === updated.id ? updated : row)) ?? null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Det gick inte att spara ändringen.')
    } finally {
      setSavingId(null)
    }
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
      </div>

      <FilterPillGroup
        ariaLabel="Kategori"
        variant="genre"
        options={CATEGORY_OPTIONS}
        value={category}
        onChange={(value) => setCategory(value as KioskCategory | 'all')}
        className="mb-4"
      />

      {saveError && <InlineFeedback variant="danger" message={saveError} className="mb-3" />}

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
          onEdit={() => {} /* TODO: open edit modal */}
          onToggleAvailable={toggleAvailable}
        />
      )}
    </div>
  )
}
