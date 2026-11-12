import { useState } from 'react'
import { Link } from 'react-router'
import { useAdminMenuItems } from '../../hooks'
import { EmptyState } from '../../components/EmptyState'
import { FilterPillGroup } from '../../components/Pills'
import { CardListSkeleton } from '../../components/Skeleton'
import AdminStatCard from '../../components/admin/AdminStatCard'
import KioskTable from '../../components/admin/KioskTable'
import { KIOSK_CATEGORIES, getKioskCategory, type KioskCategory } from '../../utils/kiosk'

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Alla' },
  ...Object.entries(KIOSK_CATEGORIES).map(([value, { label }]) => ({ value, label })),
]

export default function AdminKiosk() {
  const { data, loading, error, refetch } = useAdminMenuItems()
  const items = data ?? []
  const activeCount = items.filter((item) => item.isAvailable).length
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<KioskCategory | 'all'>('all')

  const query = search.trim().toLowerCase()
  const filteredItems = items
    .filter((item) => category === 'all' || getKioskCategory(item) === category)
    .filter((item) => `${item.name} ${item.description ?? ''}`.toLowerCase().includes(query))

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
        <KioskTable items={filteredItems} onEdit={() => {} /* TODO: open edit modal */} />
      )}
    </div>
  )
}
