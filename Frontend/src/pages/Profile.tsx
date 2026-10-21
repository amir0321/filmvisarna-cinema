import { EmptyState } from '../components/EmptyState'

export default function Profile() {
  return (
    <div className="py-4" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <EmptyState
        icon="bi-person-gear"
        title="Min Profil"
        description="Profilhantering och personliga inställningar är under utveckling."
      />
    </div>
  )
}
