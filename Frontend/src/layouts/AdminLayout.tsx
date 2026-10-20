import { Link, NavLink, Outlet } from 'react-router'

const adminNavLinks = [
  { name: 'Bokningar & Kassa', path: '/admin/bookings', icon: 'bi-ticket-perforated' },
  { name: 'Visningsschema', path: '/admin/screenings', icon: 'bi-calendar3' },
  { name: 'Filmarkiv', path: '/admin/movies', icon: 'bi-film' },
  { name: 'Salonger', path: '/admin/cinemas', icon: 'bi-display' },
]

export default function AdminLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      <header className="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-danger border-2 sticky-top shadow-sm">
        <div className="container-fluid px-3 px-md-4">
          <Link to="/admin" className="navbar-brand fw-bold d-flex align-items-center me-4">
            <span className="text-danger fw-bolder me-1">FILMVISARNA</span>
            <span className="badge bg-secondary text-uppercase fw-normal ms-1 fs-6">Backoffice</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNavbar"
            aria-controls="adminNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="adminNavbar">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {adminNavLinks.map((link) => (
                <li key={link.path} className="nav-item">
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `nav-link px-3 d-flex align-items-center ${
                        isActive ? 'active text-danger fw-bold' : 'text-light'
                      }`
                    }
                  >
                    <i className={`bi ${link.icon} me-2`}></i>
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3">
              <Link to="/" className="btn btn-outline-light btn-sm">
                <i className="bi bi-box-arrow-left me-1"></i> Till biografen
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow-1 container-fluid px-3 px-md-4 py-4">
        <Outlet />
      </main>

      <footer className="py-3 border-top border-secondary border-opacity-25 bg-black text-secondary text-center small">
        <p className="mb-0">Filmvisarna Backoffice &bull; Administrationspanel</p>
      </footer>
    </div>
  )
}
