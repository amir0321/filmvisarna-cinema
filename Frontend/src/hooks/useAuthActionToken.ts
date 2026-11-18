import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

export function useAuthActionToken(): string {
  const { hash, pathname, search } = useLocation()
  const navigate = useNavigate()
  const [token] = useState(() => new URLSearchParams(hash.slice(1)).get('token') ?? '')
  useEffect(() => {
    // Retain the secret only in component memory, replacing this history entry.
    if (hash || search) void navigate(pathname, { replace: true })
  }, [hash, pathname, search, navigate])
  return /^[a-f0-9]{64}$/.test(token) ? token : ''
}
