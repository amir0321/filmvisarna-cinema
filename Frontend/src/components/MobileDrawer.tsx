import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { getUserDisplayName, getUserInitials, useAuth } from '../hooks/useAuth'
import BrandLogo from './BrandLogo'

const PUBLIC_DRAWER_LINKS = [
  { name: 'Hem', path: '/', icon: 'bi-house-door', end: true },
  { name: 'Filmer & Repertoar', path: '/movies', icon: 'bi-film', end: false },
  { name: 'Salonger', path: '/salonger', icon: 'bi-display', end: false },
  { name: 'Om oss', path: '/om-oss', icon: 'bi-info-circle', end: false },
] as const

const AUTH_DRAWER_LINKS = [
  { name: 'Mina Bokningar', path: '/my-bookings', icon: 'bi-ticket-perforated', end: false },
  { name: 'Min Profil', path: '/profile', icon: 'bi-person', end: false },
] as const

const ADMIN_DRAWER_LINKS = [
  { name: 'Översikt', path: '/admin', icon: 'bi-layers', end: true },
  { name: 'Bokningar & Kassa', path: '/admin/bookings', icon: 'bi-ticket-perforated', end: false },
  { name: 'Visningsschema', path: '/admin/screenings', icon: 'bi-calendar3', end: false },
  { name: 'Filmarkiv', path: '/admin/movies', icon: 'bi-film', end: false },
  { name: 'Salonger', path: '/admin/cinemas', icon: 'bi-display', end: false },
] as const

export default function MobileDrawer() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const isAdminRoute = pathname.startsWith('/admin')
  const isLoggedIn = user !== null
  const isAdmin = user?.role === 'admin'
  const initials = getUserInitials(user)
  const displayName = getUserDisplayName(user)

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

  const handleLogout = () => {
    closeDrawer()
    logout()
    navigate('/')
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
            {isAdminRoute ? <span className="nav-admin-badge">ADMIN</span> : null}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="drawer-close-btn"
            data-bs-dismiss="offcanvas"
            aria-label="Stäng meny"
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
              {isLoggedIn ? user.email : 'Inte inloggad'}
            </div>
          </div>
        </div>
      </div>

      <div className="offcanvas-body d-flex flex-column justify-content-between p-0">
        <nav className="drawer-nav" aria-label="Mobilmeny">
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
                      <span>{link.name}</span>
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
                    <span>Till biografen</span>
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
                          <span>{link.name}</span>
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
                      <span>{link.name}</span>
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
                          <span>{link.name}</span>
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
                      <span>Admin Backoffice</span>
                    </span>
                    <span className="nav-admin-badge">ADMIN</span>
                  </NavLink>
                </>
              ) : null}
            </>
          )}
        </nav>

        <div className="drawer-footer d-flex flex-column gap-2">
          {isLoggedIn ? (
            <button
              type="button"
              className="drawer-logout-btn w-100"
              onClick={handleLogout}
            >
              Logga ut
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="drawer-login-outline-btn w-100 text-center text-decoration-none"
                onClick={closeDrawer}
              >
                Logga in
              </Link>
              <Link
                to="/register"
                className="drawer-login-btn w-100 text-center text-decoration-none"
                onClick={closeDrawer}
              >
                Bli Medlem
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
