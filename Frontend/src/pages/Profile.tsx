import { EmptyState } from '../components/EmptyState'

export default function Profile() {
  return (
    <div className="py-4 mw-600 mx-auto">
      <EmptyState
        icon="bi-person-gear"
        title="Min Profil"
        description="Profilhantering och personliga inställningar är under utveckling."
      />
    </div>
  )
}
