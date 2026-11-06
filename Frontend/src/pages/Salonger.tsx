import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { useCinemas } from '../hooks/useCinemas'
import { MiniAuditoriumMap } from '../components/MiniAuditoriumMap'

// Fixed texts from the design. The order matches the backend (Stora = first, Lilla = second).
const SALONG_INFO = [
  {
    title: 'Salong 1',
    color: '#E50914',
    label: 'Premiärsalong',
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
    color: '#10B981',
    label: 'Bekväma fåtöljer',
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
  const { data, loading, error } = useCinemas()

  return (
    <main className="fv-salonger">
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
        {loading && <p className="text-secondary">Laddar salonger…</p>}
        {error && <p className="text-danger">{error}</p>}

        {data?.map((cinema, i) => {
          const info = SALONG_INFO[i]
          if (!info) return null

          return (
            <article
              key={cinema.id}
              className="fv-salonger__card"
              style={{ '--tone': info.color } as CSSProperties}
            >
              <div className="fv-salonger__media">
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
            {data && (
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
    </main>
  )
}