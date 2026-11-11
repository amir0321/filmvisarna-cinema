import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { getProtectedRouteAccess } from '../../utils/routeAccess'

export default function ProtectedRoute({ children, requireAdmin = false }: {
  children: ReactNode
  requireAdmin?: boolean
}) {
  const { loading, role } = useAuth()
  const { pathname, search, hash } = useLocation()
  const access = getProtectedRouteAccess({ loading, role, path: pathname + search + hash, requireAdmin })

  if (access.status === 'loading') {
    return <p className="text-secondary p-4" role="status">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      Kontrollerar din inloggning...
    </p>
  }
  if (access.status === 'redirect') return <Navigate to={access.to} replace />
  return children
}
