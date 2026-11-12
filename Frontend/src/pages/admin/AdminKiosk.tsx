import { Link } from 'react-router'
import { useAdminMenuItems } from '../../hooks'
import { EmptyState } from '../../components/EmptyState'
import { CardListSkeleton } from '../../components/Skeleton'
import AdminStatCard from '../../components/admin/AdminStatCard'
import KioskTable from '../../components/admin/KioskTable'

export default function AdminKiosk() {
  const { data, loading, error, refetch } = useAdminMenuItems()
  const items = data ?? []
  const activeCount = items.filter((item) => item.isAvailable).length

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

      {!loading && !error && <KioskTable items={items} onEdit={() => {} /* TODO: open edit modal */} />}
    </div>
  )
}
