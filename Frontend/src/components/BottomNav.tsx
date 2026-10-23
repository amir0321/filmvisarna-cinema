import { NavLink, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const GUEST_TABS = [
  {
    name: 'Hem',
    path: '/',
    end: true,
    icon: 'bi-house-door',
    activeIcon: 'bi-house-door-fill',
  },
  {
    name: 'Filmer',
    path: '/movies',
    end: false,
    icon: 'bi-film',
    activeIcon: 'bi-film',
  },
  {
    name: 'Salonger',
    path: '/salonger',
    end: false,
    icon: 'bi-display',
    activeIcon: 'bi-display-fill',
  },
  {
    name: 'Om oss',
    path: '/om-oss',
    end: false,
    icon: 'bi-info-circle',
    activeIcon: 'bi-info-circle-fill',
  },
] as const

const AUTH_TABS = [
  {
    name: 'Hem',
    path: '/',
    end: true,
    icon: 'bi-house-door',
    activeIcon: 'bi-house-door-fill',
  },
  {
    name: 'Filmer',
    path: '/movies',
    end: false,
    icon: 'bi-film',
    activeIcon: 'bi-film',
  },
  {
    name: 'Biljetter',
    path: '/my-bookings',
    end: false,
    icon: 'bi-ticket-perforated',
    activeIcon: 'bi-ticket-perforated-fill',
  },
  {
    name: 'Profil',
    path: '/profile',
    end: false,
    icon: 'bi-person',
    activeIcon: 'bi-person-fill',
  },
] as const

const ADMIN_TABS = [
  {
    name: 'Bokningar',
    path: '/admin/bookings',
    end: false,
    icon: 'bi-ticket-perforated',
    activeIcon: 'bi-ticket-perforated-fill',
  },
  {
    name: 'Schema',
    path: '/admin/screenings',
    end: false,
    icon: 'bi-calendar3',
    activeIcon: 'bi-calendar3',
  },
  {
    name: 'Filmer',
    path: '/admin/movies',
    end: false,
    icon: 'bi-film',
    activeIcon: 'bi-film',
  },
  {
    name: 'Salonger',
    path: '/admin/cinemas',
    end: false,
    icon: 'bi-display',
    activeIcon: 'bi-display-fill',
  },
] as const

export default function BottomNav() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  const tabs = isAdminRoute ? ADMIN_TABS : user ? AUTH_TABS : GUEST_TABS

  return (
    <nav className="bottom-nav d-flex d-md-none" aria-label="Bottennavigering">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? <span className="bottom-nav-indicator" aria-hidden="true" /> : null}
              <i
                className={`bi ${isActive ? tab.activeIcon : tab.icon} bottom-nav-icon`}
                aria-hidden="true"
              ></i>
              <span className="bottom-nav-label">{tab.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
