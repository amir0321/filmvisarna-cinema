import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body text-body p-4">
      <div className="text-center p-5 bg-card border rounded-3 shadow mw-520">
        <div className="text-danger display-1 fw-bold mb-3">404</div>
        <h1 className="h2 fw-bold mb-3">Sidan kunde inte hittas</h1>
        <p className="text-secondary mb-4">
          Adressen du försöker nå finns inte eller har flyttats. Gå tillbaka till startsidan för att hitta
          aktuella filmer och föreställningar.
        </p>
        <Link to="/" className="btn btn-danger px-4 py-2 fw-semibold">
          <i className="bi bi-house-door me-2" aria-hidden="true"></i> Tillbaka till startsidan
        </Link>
      </div>
    </div>
  )
}
