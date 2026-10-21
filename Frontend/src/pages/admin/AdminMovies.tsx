import { EmptyState } from '../../components/EmptyState'

export default function AdminMovies() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Filmarkiv</h1>
          <p className="text-secondary mb-0">Lägg till nya filmer och redigera befintligt repertoarinnehåll.</p>
        </div>
      </div>

      <EmptyState
        icon="bi-film"
        title="Filmarkiv"
        description="Filmarkivsmodulen för administration av filmer och posters är under utveckling."
      />
    </div>
  )
}
