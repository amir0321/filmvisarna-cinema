import { EmptyState } from '../../components/EmptyState'

export default function AdminScreenings() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Visningsschema</h1>
          <p className="text-secondary mb-0">Schemalägg nya föreställningar och hantera salongstider.</p>
        </div>
      </div>

      <EmptyState
        icon="bi-calendar3"
        title="Visningsschema"
        description="Schemaläggningsmodulen för administration av visningar är under utveckling."
      />
    </div>
  )
}
