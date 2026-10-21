import { Link } from 'react-router'
import { getAuthToken } from '../api/client'

export default function MyBookings() {
  const token = getAuthToken()

  return (
    <div className="container-fluid px-3 px-md-5 py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Mina bokningar</h2>
          <p className="text-secondary mb-0">Här ser du alla dina kommande och tidigare biobokningar.</p>
        </div>
      </div>

      {!token ? (
        <div className="card bg-black border-secondary border-opacity-25 p-4 text-center">
          <div className="py-4">
            <i className="bi bi-person-lock text-danger display-4 mb-3 d-block"></i>
            <h4 className="fw-bold">Logga in för att se dina bokningar</h4>
            <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: '480px' }}>
              Som medlem samlas alla dina bokningar här automatiskt. Har du bokat som gäst hittar du din
              bokningsbekräftelse i ditt e-postmeddelande.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Link to="/movies" className="btn btn-outline-danger">
                Utforska filmer
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-black border-secondary border-opacity-25 p-4 text-center">
          <p className="text-secondary mb-0">Inga aktiva bokningar hittades.</p>
        </div>
      )}
    </div>
  )
}
