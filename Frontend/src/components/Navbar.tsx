import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { getUserDisplayName, getUserInitials, useAuth } from '../hooks/useAuth'
import BrandLogo from './BrandLogo'

const BASE_NAV_LINKS = [
  { name: 'Hem', path: '/', end: true },
  { name: 'Filmer & Repertoar', path: '/movies', end: false },
  { name: 'Salonger', path: '/salonger', end: false },
  { name: 'Om oss', path: '/om-oss', end: false },
] as const

const ADMIN_NAV_LINKS = [
  { name: 'Bokningar', path: '/admin/bookings', icon: 'bi-ticket-perforated', end: false },
  { name: 'Schema', path: '/admin/screenings', icon: 'bi-calendar3', end: false },
  { name: 'Filmer', path: '/admin/movies', icon: 'bi-film', end: false },
  { name: 'Salonger', path: '/admin/cinemas', icon: 'bi-display', end: false },
] as const

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isAdminRoute = pathname.startsWith('/admin')
  const isLoggedIn = user !== null
  const isAdmin = user?.role === 'admin'
  const initials = getUserInitials(user)
  const displayName = getUserDisplayName(user)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="app-navbar sticky-top">
      <nav
        className="nav-container"
        aria-label={isAdminRoute ? 'Administrationsnavigering' : 'Huvudnavigering'}
      >
        <div className="d-flex align-items-center gap-2 nav-brand-group">
          <BrandLogo />
          {isAdminRoute ? (
            <span className="nav-admin-badge d-none d-lg-inline-block">ADMIN</span>
          ) : null}
        </div>

        {/* Desktop navigation links */}
        <ul className="d-none d-md-flex align-items-center list-unstyled mb-0 nav-links-list">
          {isAdminRoute ? (
            <>
              {ADMIN_NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.end}
                    className={({ isActive }) =>
                      `public-nav-link d-inline-flex align-items-center gap-1 gap-xl-2 ${isActive ? 'active' : ''}`
                    }
                  >
                    <i className={`bi ${link.icon} d-none d-xl-inline`} aria-hidden="true"></i>
                    <span>{link.name}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `public-nav-link d-inline-flex align-items-center gap-1 gap-xl-2 ${isActive ? 'active' : ''}`
                  }
                >
                  <i className="bi bi-box-arrow-left d-none d-xl-inline" aria-hidden="true"></i>
                  <span>Till biografen</span>
                </NavLink>
              </li>
            </>
          ) : (
            <>
              {BASE_NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.end}
                    className={({ isActive }) =>
                      `public-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}

              {isLoggedIn ? (
                <li>
                  <NavLink
                    to="/my-bookings"
                    className={({ isActive }) =>
                      `public-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    Mina Bokningar
                  </NavLink>
                </li>
              ) : null}

              {isAdmin ? (
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `public-nav-link d-inline-flex align-items-center gap-2 ${isActive ? 'active' : ''}`
                    }
                  >
                    <span>Admin</span>
                    <span className="nav-admin-badge d-none d-lg-inline-block">ADMIN</span>
                  </NavLink>
                </li>
              ) : null}
            </>
          )}
        </ul>

        {/* Right actions (shared search button + desktop/mobile controls) */}
        <div className="d-flex align-items-center gap-2 nav-actions-group">
          <button
            type="button"
            className="nav-search-btn"
            aria-label="Sök"
            title="Kommer snart"
            disabled
          >
            <i className="bi bi-search" aria-hidden="true"></i>
          </button>

          {/* Desktop auth actions (>= 768px) */}
          <div className="d-none d-md-flex align-items-center gap-2">
            {isLoggedIn ? (
              <div className="dropdown">
                <button
                  type="button"
                  className="nav-avatar-btn dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label={`Användarmeny för ${displayName}`}
                >
                  <span className="nav-avatar-circle" aria-hidden="true">
                    {initials}
                  </span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end nav-user-dropdown">
                  <li className="px-3 py-2 border-bottom border-secondary border-opacity-25">
                    <div className="fw-semibold text-light small text-truncate">{displayName}</div>
                    <div className="text-secondary nav-dropdown-email text-truncate">{user.email}</div>
                  </li>
                  <li>
                    <NavLink to="/profile" className="dropdown-item d-flex align-items-center gap-2">
                      <i className="bi bi-person" aria-hidden="true"></i>
                      <span>Min Profil</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/my-bookings" className="dropdown-item d-flex align-items-center gap-2">
                      <i className="bi bi-ticket-perforated" aria-hidden="true"></i>
                      <span>Mina Bokningar</span>
                    </NavLink>
                  </li>
                  {isAdmin ? (
                    <li>
                      <NavLink
                        to={isAdminRoute ? '/' : '/admin'}
                        end={isAdminRoute}
                        className="dropdown-item d-flex align-items-center justify-content-between gap-2"
                      >
                        <span className="d-inline-flex align-items-center gap-2">
                          <i
                            className={`bi ${isAdminRoute ? 'bi-box-arrow-left' : 'bi-layers'}`}
                            aria-hidden="true"
                          ></i>
                          <span>{isAdminRoute ? 'Till biografen' : 'Admin Backoffice'}</span>
                        </span>
                        {!isAdminRoute ? <span className="nav-admin-badge">ADMIN</span> : null}
                      </NavLink>
                    </li>
                  ) : null}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item d-flex align-items-center gap-2 nav-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
                      <span>Logga ut</span>
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `nav-login-btn ${isActive ? 'active' : ''}`
                  }
                >
                  Logga in
                </NavLink>
                <Link to="/register" className="nav-register-btn">
                  Bli Medlem
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle (< 768px) */}
          <div className="d-flex d-md-none align-items-center gap-2">
            <button
              type="button"
              className="nav-hamburger-btn"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileDrawer"
              aria-controls="mobileDrawer"
              aria-label="Öppna meny"
            >
              <i className="bi bi-list" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}
