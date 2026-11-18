import type { AuthRole, RoleLabel, User } from '../types/user'

export function getAuthRole(user: User | null): AuthRole {
  if (!user) return 'guest'
  return user.role === 'admin' ? 'admin' : 'user'
}

export function getRoleLabel(role: AuthRole): RoleLabel {
  const labels: Record<AuthRole, RoleLabel> = { guest: 'Gäst', user: 'Medlem', admin: 'Admin' }
  return labels[role]
}
