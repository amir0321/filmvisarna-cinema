import { Link, NavLink } from 'react-router'

const publicNavLinks = [
  { name: 'Hem', path: '/' },
  { name: 'Filmer', path: '/movies' },
  { name: 'Mina bokningar', path: '/my-bookings' },
]

export default function Header() {
  return (
    <header className="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary border-opacity-25 sticky-top">
      <div className="container-fluid px-3 px-md-5">
        <Link to="/" className="navbar-brand fw-bold d-flex align-items-center text-danger text-uppercase tracking-wider">
          <i className="bi bi-film me-2 fs-4"></i>
          <span>Filmvisarna</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNavbar"
          aria-controls="publicNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="publicNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {publicNavLinks.map((link) => (
              <li key={link.path} className="nav-item">
                <NavLink
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `nav-link px-3 ${isActive ? 'active text-danger fw-semibold' : 'text-light'}`
                  }
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center gap-2">
            <Link to="/admin" className="btn btn-outline-secondary btn-sm text-nowrap">
              <i className="bi bi-shield-lock me-1"></i> Admin
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
