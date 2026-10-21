import { EmptyState } from '../components/EmptyState'

export default function About() {
  return (
    <div className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Om Filmvisarna</h1>
          <p className="text-secondary mb-0">Din lokala biograf i Småstad med hjärta för film och gemenskap.</p>
        </div>
      </div>

      <EmptyState
        icon="bi-info-circle"
        title="Om oss"
        description="Presentation av biografen, vår historia och kontaktuppgifter är under sammanställning."
      />
    </div>
  )
}
