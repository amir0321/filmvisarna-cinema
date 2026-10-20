import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark text-light p-4">
      <div className="text-center p-5 bg-black border border-secondary border-opacity-25 rounded-3 shadow" style={{ maxWidth: '520px' }}>
        <div className="text-danger display-1 fw-bold mb-3">404</div>
        <h2 className="fw-bold mb-3">Sidan kunde inte hittas</h2>
        <p className="text-secondary mb-4">
          Adressen du försöker nå finns inte eller har flyttats. Gå tillbaka till startsidan för att hitta
          aktuella filmer och föreställningar.
        </p>
        <Link to="/" className="btn btn-danger px-4 py-2 fw-semibold">
          <i className="bi bi-house-door me-2"></i> Tillbaka till startsidan
        </Link>
      </div>
    </div>
  )
}
