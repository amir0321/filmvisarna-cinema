import { Navigate, useLocation } from 'react-router'

export default function RouteRedirect({ to }: { to: string }) {
  const { search, hash, state } = useLocation()
  return <Navigate to={{ pathname: to, search, hash }} state={state} replace />
}
