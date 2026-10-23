import { EmptyState } from '../../components/EmptyState'

export default function AdminBookings() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Bokningar &amp; Kassa</h1>
          <p className="text-secondary mb-0">Hantera bokningar, checka in gäster och hantera betalningar.</p>
        </div>
      </div>

      <EmptyState
        icon="bi-ticket-perforated"
        title="Bokningar &amp; Kassa"
        description="Boknings- och kassamodulen är under utveckling."
      />
    </div>
  )
}
