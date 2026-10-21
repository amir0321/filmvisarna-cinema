import { EmptyState } from '../../components/EmptyState'

export default function AdminCinemas() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Salonger</h1>
          <p className="text-secondary mb-0">Hantera salongskonfigurationer, stolsrader och tillgänglighetsanpassning.</p>
        </div>
      </div>

      <EmptyState
        icon="bi-display"
        title="Salongskonfiguration"
        description="Salongsmodulen för konfiguration och stolsöversikt är under utveckling."
      />
    </div>
  )
}
