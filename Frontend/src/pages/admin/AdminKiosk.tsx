import { Link } from 'react-router'
import { useAdminMenuItems } from '../../hooks'
import { EmptyState } from '../../components/EmptyState'
import { CardListSkeleton } from '../../components/Skeleton'

export default function AdminKiosk() {
  const { data: items, loading, error, refetch } = useAdminMenuItems()

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

      {!loading && !error && <p className="text-secondary">{items?.length ?? 0} produkter</p>}
    </div>
  )
}
