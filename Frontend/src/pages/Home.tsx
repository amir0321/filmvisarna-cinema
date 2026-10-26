import { Link } from 'react-router'
import { Badge } from '../components/Badge'

export default function Home() {
  return (
    <div className="text-center py-5">
      <div className="py-4">
        <Badge variant="danger" pill className="px-3 py-2 text-uppercase mb-3 fw-bold">
          Film är bäst på riktig bio
        </Badge>
        <h1 className="display-4 fw-bold text-white mb-3">Välkommen till Filmvisarna</h1>
        <p className="lead text-secondary mx-auto mb-4 mw-600">
          Upptäck aktuella filmer, boka dina favoritplatser i våra moderna salonger och njut av Småstads
          bästa bioupplevelse.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/movies" className="btn btn-danger btn-lg px-4 fw-semibold">
            <i className="bi bi-film me-2"></i> Se repertoar
          </Link>
          <Link to="/my-bookings" className="btn btn-outline-light btn-lg px-4">
            Mina bokningar
          </Link>
        </div>
      </div>
    </div>
  )
}
