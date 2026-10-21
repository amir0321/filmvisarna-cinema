import { EmptyState } from '../components/EmptyState'

export default function Salonger() {
  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Våra Salonger</h1>
          <p className="text-secondary mb-0">Upplev film i toppmoderna salonger med högsta bild- och ljudkvalitet.</p>
        </div>
      </div>

      <EmptyState
        icon="bi-display"
        title="Våra Salonger"
        description="Salongsinformation, teknikspecifikationer och interaktiva minikartor är under utveckling."
      />
    </div>
  )
}
