import { translateApiError } from '../i18n/mappers'
import LanguageToggle from './LanguageToggle'
import { useTranslation } from '../context/LocaleContext'
import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { getUserDisplayName, getUserInitials, useAuth } from '../hooks/useAuth'
import BrandLogo from './BrandLogo'
import { BookingCountBadge } from './BookingCountBadge'
import ThemeToggle from './ThemeToggle'

const PUBLIC_DRAWER_LINKS = [
  { name: 'nav.home', path: '/', icon: 'bi-house-door', end: true },
  { name: 'nav.programme', path: '/filmer', icon: 'bi-film', end: false },
  { name: 'nav.cinemas', path: '/salonger', icon: 'bi-display', end: false },
  { name: 'nav.about', path: '/om-oss', icon: 'bi-info-circle', end: false },
] as const

const AUTH_DRAWER_LINKS = [
  { name: 'nav.myBookings', path: '/mina-bokningar', icon: 'bi-ticket-perforated', end: false },
  { name: 'nav.myProfile', path: '/profil', icon: 'bi-person', end: false },
] as const

const ADMIN_DRAWER_LINKS = [
  { name: 'nav.backoffice', path: '/admin', icon: 'bi-layers', end: true },
  { name: 'nav.bookingsCashier', path: '/admin/bokningar', icon: 'bi-ticket-perforated', end: false },
  { name: 'nav.screeningSchedule', path: '/admin/visningar', icon: 'bi-calendar3', end: false },
  { name: 'nav.movieArchive', path: '/admin/filmer', icon: 'bi-film', end: false },
  { name: 'nav.cinemas', path: '/admin/salonger', icon: 'bi-display', end: false },
  { name: 'nav.kioskAssortment', path: '/admin/kiosk', icon: 'bi-cup-straw', end: false },
] as const

export default function MobileDrawer() {
  const { t, locale } = useTranslation()
  const { user, logout, loggingOut, logoutError } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const isAdminRoute = pathname.startsWith('/admin')
  const isLoggedIn = user !== null
  const isAdmin = user?.role === 'admin'
  const initials = getUserInitials(user)
  const displayName = user ? getUserDisplayName(user) : t('nav.guest')

  const closeDrawer = () => {
    closeBtnRef.current?.click()
  }

  useEffect(() => {
    return () => {
      document.querySelectorAll('.offcanvas-backdrop').forEach((el) => el.remove())
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('padding-right')
    }
  }, [])

  const handleLogout = async () => {
    try { await logout(); closeDrawer(); navigate('/') } catch { /* The drawer displays the error. */ }
  }

  return (
    <div
      className="offcanvas offcanvas-end mobile-drawer"
      tabIndex={-1}
      id="mobileDrawer"
      aria-labelledby="mobileDrawerLabel"
    >
      <div className="mobile-drawer-header">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <BrandLogo onClick={closeDrawer} />
            {isAdminRoute ? <span className="nav-admin-badge">{t('nav.admin')}</span> : null}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="drawer-close-btn"
            data-bs-dismiss="offcanvas"
            aria-label={t('nav.closeMenu')}
          >
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div
            className={`drawer-avatar ${isLoggedIn ? 'drawer-avatar-user' : 'drawer-avatar-guest'}`}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div id="mobileDrawerLabel" className="drawer-user-name text-truncate">
              {displayName}
            </div>
            <div className="drawer-user-status text-truncate">
              {isLoggedIn ? user.email : t('nav.notLoggedIn')}
            </div>
          </div>
        </div>
      </div>

      <div className="offcanvas-body d-flex flex-column justify-content-between p-0">
        <nav className="drawer-nav" aria-label={t('nav.mobileNavigation')}>
          {isAdminRoute ? (
            <>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                {ADMIN_DRAWER_LINKS.map((link) => (
                  <li key={link.path}>
                    <NavLink
                      to={link.path}
                      end={link.end}
                      onClick={closeDrawer}
                      className={({ isActive }) =>
                        `drawer-nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <i className={`bi ${link.icon} drawer-nav-icon`} aria-hidden="true"></i>
                      <span>{t(link.name)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>

              <div className="drawer-divider" role="separator" />

              <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                <li>
                  <NavLink
                    to="/"
                    end
                    onClick={closeDrawer}
                    className={({ isActive }) =>
                      `drawer-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <i className="bi bi-box-arrow-left drawer-nav-icon" aria-hidden="true"></i>
                    <span>{t('nav.toCinema')}</span>
                  </NavLink>
                </li>
                {isLoggedIn
                  ? AUTH_DRAWER_LINKS.map((link) => (
                      <li key={link.path}>
                        <NavLink
                          to={link.path}
                          end={link.end}
                          onClick={closeDrawer}
                          className={({ isActive }) =>
                            `drawer-nav-link ${isActive ? 'active' : ''}`
                          }
                        >
                          <i className={`bi ${link.icon} drawer-nav-icon`} aria-hidden="true"></i>
                          <span>{t(link.name)}</span>
                          {link.path === '/mina-bokningar' ? <BookingCountBadge /> : null}
                        </NavLink>
                      </li>
                    ))
                  : null}
              </ul>
            </>
          ) : (
            <>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                {PUBLIC_DRAWER_LINKS.map((link) => (
                  <li key={link.path}>
                    <NavLink
                      to={link.path}
                      end={link.end}
                      onClick={closeDrawer}
                      className={({ isActive }) =>
                        `drawer-nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <i className={`bi ${link.icon} drawer-nav-icon`} aria-hidden="true"></i>
                      <span>{t(link.name)}</span>
                    </NavLink>
                  </li>
                ))}

                {isLoggedIn
                  ? AUTH_DRAWER_LINKS.map((link) => (
                      <li key={link.path}>
                        <NavLink
                          to={link.path}
                          end={link.end}
                          onClick={closeDrawer}
                          className={({ isActive }) =>
                            `drawer-nav-link ${isActive ? 'active' : ''}`
                          }
                        >
                          <i className={`bi ${link.icon} drawer-nav-icon`} aria-hidden="true"></i>
                          <span>{t(link.name)}</span>
                          {link.path === '/mina-bokningar' ? <BookingCountBadge /> : null}
                        </NavLink>
                      </li>
                    ))
                  : null}
              </ul>

              {isAdmin ? (
                <>
                  <div className="drawer-divider" role="separator" />
                  <NavLink
                    to="/admin"
                    onClick={closeDrawer}
                    className={({ isActive }) =>
                      `drawer-nav-link justify-content-between ${isActive ? 'active' : ''}`
                    }
                  >
                    <span className="d-inline-flex align-items-center gap-3">
                      <i className="bi bi-layers drawer-nav-icon" aria-hidden="true"></i>
                      <span>{t('nav.backoffice')}</span>
                    </span>
                    <span className="nav-admin-badge">{t('nav.admin')}</span>
                  </NavLink>
                </>
              ) : null}
            </>
          )}
        </nav>

        <div className="drawer-footer d-flex flex-column gap-2">
          <ThemeToggle variant="menu" />
          <LanguageToggle variant="menu" />
          {logoutError && <p className="text-danger small" role="alert">{translateApiError(logoutError, locale)}</p>}
          {isLoggedIn ? (
            <button
              type="button"
              className="drawer-logout-btn w-100"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              {t(loggingOut ? 'nav.loggingOut' : 'nav.logout')}
            </button>
          ) : (
            <>
              <Link
                to="/logga-in"
                className="drawer-login-outline-btn w-100 text-center text-decoration-none"
                onClick={closeDrawer}
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/skapa-konto"
                className="drawer-login-btn w-100 text-center text-decoration-none"
                onClick={closeDrawer}
              >
                {t('nav.join')}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
