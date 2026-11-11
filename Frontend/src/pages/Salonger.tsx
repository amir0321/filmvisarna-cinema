import { useState } from 'react'
import { Link } from 'react-router'
import { useCinemas } from '../hooks/useCinemas'
import { MiniAuditoriumMap } from '../components/MiniAuditoriumMap'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'

// Fixed texts from the design. The order matches the backend (Stora = first, Lilla = second).
const SALONG_INFO = [
  {
    title: 'Salong 1',
    tone: 'primary',
    label: 'Premiärsalong',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop&auto=format',
    tags: ['4K Laser', 'Dolby Atmos'],
    points: [
      '4K Laser Projektor',
      'Dolby Atmos Ljud',
      'Bred duk (18m)',
      'Rullstolsplatser (rad A)',
      'Barservering tillgänglig',
    ],
  },
  {
    title: 'Salong 2',
    tone: 'success',
    label: 'Bekväma fåtöljer',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=450&fit=crop&auto=format',
    tags: ['2D', 'Stereo'],
    points: [
      '2D Digital Projektor',
      'Premium Fåtöljer',
      'Intim atmosfär',
      'Rullstolsplatser (rad A)',
      'Familjevänlig',
    ],
  },
]

// "18×8 m" from the backend -> "18 × 8 m duk" as in the design
function formatScreen(size: string | null) {
  return size ? `${size.replace('×', ' × ')} duk` : '–'
}

export default function Salonger() {
  const { data, loading, error, refetch } = useCinemas()
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({})

  return (
    <div className="fv-salonger full-bleed">
      <section className="fv-salonger__hero">
        <div className="fv-salonger__hero-inner">
          <span className="fv-salonger__badge">Filmvisarna Småstad</span>
          <h1 className="fv-salonger__title">Våra Salonger</h1>
          <p className="fv-salonger__lead">
            Två salonger med det bästa i ljud och bild — oavsett om du söker storslaget eller intimt.
          </p>
        </div>
      </section>

      <section className="fv-salonger__cards">
        {loading &&
          [0, 1].map((index) => (
            <div key={index} className="fv-salonger__card" role="status" aria-busy="true">
              <span className="visually-hidden">Laddar salonger…</span>
              <div className="fv-salonger__media">
                <Skeleton variant="rect" height="100%" />
              </div>
              <div className="fv-salonger__body">
                <Skeleton variant="text" width="45%" height="28px" className="mb-2" />
                <Skeleton variant="text" width="30%" height="16px" className="mb-4" />
                <Skeleton variant="rect" height="140px" className="mb-3 rounded-3" />
                <Skeleton variant="rect" height="44px" className="rounded-3 mt-auto" />
              </div>
            </div>
          ))}

        {!loading && error && (
          <div className="fv-salonger__state">
            <EmptyState
              variant="error"
              title="Kunde inte hämta salongerna"
              description={error}
              actionLabel="Försök igen"
              onAction={refetch}
            />
          </div>
        )}

        {!loading && !error && (!data || data.length === 0) && (
          <div className="fv-salonger__state">
            <EmptyState
              icon="bi-display"
              title="Inga salonger hittades"
              description="Det finns inga registrerade salonger att visa just nu."
              actionLabel="Försök igen"
              onAction={refetch}
            />
          </div>
        )}

        {!loading &&
          !error &&
          data?.map((cinema, i) => {
            const info = SALONG_INFO[i]
            if (!info) return null

            return (
              <article
                key={cinema.id}
                className={`fv-salonger__card fv-salonger__card--${info.tone}`}
              >
                <div className="fv-salonger__media">
                  {!failedImages[cinema.id] && (
                    <img
                      src={info.image}
                      alt={`${info.title} – ${cinema.name}`}
                      className="fv-salonger__media-img"
                      loading="lazy"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [cinema.id]: true }))
                      }
                    />
                  )}
                  <span className="fv-salonger__pill fv-salonger__pill--dark fv-salonger__media-top">
                    {info.label}
                  </span>
                  <div className="fv-salonger__media-bottom">
                    <span className="fv-salonger__pill fv-salonger__pill--solid">
                      {cinema.total_seats} platser
                    </span>
                    {info.tags.map((tag) => (
                      <span key={tag} className="fv-salonger__pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="fv-salonger__body">
                  <div className="fv-salonger__head">
                    <div>
                      <h2 className="fv-salonger__name">{info.title}</h2>
                      <p className="fv-salonger__sub">{cinema.name}</p>
                    </div>
                    <span className="fv-salonger__access">
                      <i className="bi bi-person-wheelchair" aria-hidden="true" /> Tillgänglig
                    </span>
                  </div>

                  <ul className="fv-salonger__points">
                    {info.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <MiniAuditoriumMap seats={cinema.seats} />
                  <Link to="/" className="fv-salonger__cta">
                    Se schema →
                  </Link>
                </div>
              </article>
            )
          })}
      </section>

      {!loading && !error && data && data.length > 0 && (
        <section className="fv-salonger__info-wrap">
          <div className="fv-salonger__info">
            <div>
              <h3 className="fv-salonger__info-title">Tillgänglighet &amp; Rullstolsplatser</h3>
              <p className="fv-salonger__info-text">
                Båda salongerna är fullt tillgängliga för besökare med rörelsehinder. Rullstolsplatser
                finns i den första raden (Rad A) vid sidan av salongen, med fri sikt till duken.
              </p>
              <ul className="fv-salonger__info-list">
                <li>Bred ingång utan tröskel</li>
                <li>Ramp till alla salonger</li>
                <li>Tillgängliga toaletter i foajén</li>
                <li>Induktionsslinga för hörselhjälpmedel</li>
              </ul>
            </div>

            <div>
              <h3 className="fv-salonger__info-title">Dukens placering</h3>
              <p className="fv-salonger__info-text">
                Båda salongerna har trappande sittning för fri sikt. Duken är placerad centralt med
                optimalt siktavstånd från alla platser.
              </p>
              <div className="fv-salonger__facts">
                {data.map((c) => (
                  <div key={c.id} className="fv-salonger__fact">
                    <span>{c.name}</span>
                    <strong>{formatScreen(c.screen_size)}</strong>
                  </div>
                ))}
                <div className="fv-salonger__fact">
                  <span>Optimal sittrad</span>
                  <strong>Rad D–G</strong>
                </div>
                <div className="fv-salonger__fact">
                  <span>Öppningsår</span>
                  <strong>{data.map((c) => c.opened_year ?? '–').join(' / ')}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
