import { useState } from 'react'
import { getAuthToken } from '../api/client'
import { Tabs } from '../components/Tabs'
import { EmptyState } from '../components/EmptyState'

export default function MyBookings() {
  const token = getAuthToken()
  const [activeTab, setActiveTab] = useState<string>('active')

  return (
    <div className="py-4" style={{ maxWidth: '768px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Mina bokningar</h1>
          <p className="text-secondary mb-0">Här ser du alla dina kommande och tidigare biobokningar.</p>
        </div>
      </div>

      {!token ? (
        <EmptyState
          icon="bi-person-lock"
          title="Logga in för att se dina bokningar"
          description="Som medlem samlas alla dina bokningar här automatiskt. Har du bokat som gäst hittar du din bokningsbekräftelse i ditt e-postmeddelande."
          actionLabel="Utforska filmer"
          actionTo="/movies"
        />
      ) : (
        <Tabs value={activeTab} onChange={setActiveTab} variant="segmented">
          <div className="mb-4">
            <Tabs.List ariaLabel="Välj bokningsflik">
              <Tabs.Trigger value="active">Aktuella bokningar</Tabs.Trigger>
              <Tabs.Trigger value="history">Bokningshistorik</Tabs.Trigger>
            </Tabs.List>
          </div>

          <Tabs.Panel value="active">
            <EmptyState
              icon="bi-film"
              title="Inga aktuella bokningar"
              description="Dina bokningar visas här när du har bokat biljetter."
              actionLabel="Se repertoaren"
              actionTo="/movies"
            />
          </Tabs.Panel>

          <Tabs.Panel value="history">
            <EmptyState
              icon="bi-clock-history"
              title="Ingen bokningshistorik ännu"
              description="Tidigare biobesök kommer att visas här efter att visningen ägt rum."
            />
          </Tabs.Panel>
        </Tabs>
      )}
    </div>
  )
}
