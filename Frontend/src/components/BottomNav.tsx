import { useTranslation } from '../context/LocaleContext'
import type { SimpleTranslationKey } from '../i18n'
import { NavLink, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { BookingCountBadge } from './BookingCountBadge'

interface BottomNavTab {
  name: SimpleTranslationKey
  path: string
  end: boolean
  icon: string
  activeIcon: string
}

const GUEST_TABS: readonly BottomNavTab[] = [
  {
    name: 'nav.home',
    path: '/',
    end: true,
    icon: 'bi-house-door',
    activeIcon: 'bi-house-door-fill',
  },
  {
    name: 'nav.movies',
    path: '/filmer',
    end: false,
    icon: 'bi-film',
    activeIcon: 'bi-film',
  },
  {
    name: 'nav.cinemas',
    path: '/salonger',
    end: false,
    icon: 'bi-display',
    activeIcon: 'bi-display-fill',
  },
  {
    name: 'nav.about',
    path: '/om-oss',
    end: false,
    icon: 'bi-info-circle',
    activeIcon: 'bi-info-circle-fill',
  },
]

const AUTH_TABS: readonly BottomNavTab[] = [
  {
    name: 'nav.home',
    path: '/',
    end: true,
    icon: 'bi-house-door',
    activeIcon: 'bi-house-door-fill',
  },
  {
    name: 'nav.movies',
    path: '/filmer',
    end: false,
    icon: 'bi-film',
    activeIcon: 'bi-film',
  },
  {
    name: 'nav.tickets',
    path: '/mina-bokningar',
    end: false,
    icon: 'bi-ticket-perforated',
    activeIcon: 'bi-ticket-perforated-fill',
  },
  {
    name: 'nav.profile',
    path: '/profil',
    end: false,
    icon: 'bi-person',
    activeIcon: 'bi-person-fill',
  },
]

const ADMIN_TABS: readonly BottomNavTab[] = [
  {
    name: 'nav.bookings',
    path: '/admin/bokningar',
    end: false,
    icon: 'bi-ticket-perforated',
    activeIcon: 'bi-ticket-perforated-fill',
  },
  {
    name: 'nav.schedule',
    path: '/admin/visningar',
    end: false,
    icon: 'bi-calendar3',
    activeIcon: 'bi-calendar3',
  },
  {
    name: 'nav.movies',
    path: '/admin/filmer',
    end: false,
    icon: 'bi-film',
    activeIcon: 'bi-film',
  },
  {
    name: 'nav.cinemas',
    path: '/admin/salonger',
    end: false,
    icon: 'bi-display',
    activeIcon: 'bi-display-fill',
  },
]

export default function BottomNav() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isAdminRoute = pathname.startsWith('/admin')

  const tabs = isAdminRoute ? ADMIN_TABS : user ? AUTH_TABS : GUEST_TABS

  return (
    <nav className="bottom-nav d-flex d-md-none" aria-label={t('nav.bottomNavigation')}>
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
              <span className="bottom-nav-label">
                {t(tab.name)}
                {tab.path === '/mina-bokningar' ? <BookingCountBadge /> : null}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
