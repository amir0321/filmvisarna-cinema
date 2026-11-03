import { Link } from 'react-router'

const FEATURES = [
  {
    icon: '🎟️',
    title: 'Trygg bokning',
    text: 'Reservera dina favoritstolar direkt på nätet, betala när du anländer — helt utan onlinebetalning.',
  },
  {
    icon: '🔊',
    title: 'Modern salongsteknik',
    text: '4K Laser-projektion och kristallklart Dolby Atmos-surroundljud för en biografupplevelse utöver det vanliga.',
  },
  {
    icon: '☕',
    title: 'Senior- & Matinérabatt',
    text: 'Extra förmånliga priser för pensionärer och barnfamiljer. Bio ska vara tillgänglig för alla.',
  },
]
const KIOSK = [
  { icon: '🍿', name: 'Klassikern', text: 'Varma mellanpopcorn + 50cl kall läsk', price: 79 },
  { icon: '🎬', name: 'Stora Biomyset', text: 'Stora popcorn, 2× dryck + godispåse', price: 129 },
  { icon: '☕', name: 'Småstads Kaffepaket', text: 'Nybryggt kaffe/te & lokal kaka', price: 49 },
]
const SALONGER = [
  {
    name: 'Salong 1',
    subtitle: 'Stora Salongen',
    seats: 80,
    tag: '4K · Dolby Atmos',
    tone: 'red',
    text: 'Vår flaggskeppssalong med fullskalig 4K laser-projektor och Dolby Atmos-ljud. Välj en av 80 stolar för en överväldigande filmupplevelse.',
    points: ['80 sittplatser', '4K Laser-projektion', 'Dolby Atmos surroundljud', 'Rullstolsanpassad (Rad A)'],
  },
  {
    name: 'Salong 2',
    subtitle: 'Lilla Salongen',
    seats: 40,
    tag: '2D · Intimt',
    tone: 'amber',
    text: 'Lilla salongen med sin intima atmosfär och mjuka fåtöljer är perfekt för konstfilm, drama och titlar som kräver lite extra ro och närvaro.',
    points: ['40 sittplatser', 'Mysiga premiumfåtöljer', 'Perfekt akustik', 'Optimal för drama & konstfilm'],
  },
]
export default function About() {
  return (
    <div className="fv-about">
      <section className="fv-about__hero">
        <span className="fv-about__badge">
          <i className="bi bi-film" aria-hidden="true" /> OM OSS
        </span>
        <h1 className="fv-about__title">
          Filmvisarna – <span className="fv-about__accent">Film är bäst på riktig bio</span>
        </h1>
        <p className="fv-about__lead">
          En lokal, oberoende biograf i Småstad med hjärta för film, gemenskap och äkta biokänsla.
        </p>
      </section>

      <section className="fv-about__section">
        <div className="fv-about__story">
          <div>
            <span className="fv-about__eyebrow">VÅR HISTORIA</span>
            <h2 className="fv-about__h2">En biograf som bryr sig om sina gäster</h2>
            <p className="fv-about__text">
              Filmvisarna grundades av biografälskare som tröttnade på den opersonliga upplevelsen hos de
              stora kedjorna. Vi ville skapa något varmare — ett ställe där filmen verkligen är i centrum
              och varje gäst känner sig välkommen.
            </p>
            <p className="fv-about__text">
              I hjärtat av Småstad erbjuder vi en handplockad repertoar med allt från breda publiksuccéer
              till prisade konstfilmer. Vår filosofi är enkel: rimliga biljettpriser, ingen krånglig
              onlinebetalning och en kiosk som poppar nytt inför varje visning.
            </p>
            <p className="fv-about__text">
              Reservera dina favoritstolar online och betala bekvämt i kassan när du anländer. Ingen
              kortterminal-stress, inga dolda avgifter — bara biokänsla.
            </p>
          </div>

          <div className="fv-about__features">
            {FEATURES.map((f) => (
              <div key={f.title} className="fv-about__feature">
                <span className="fv-about__feature-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <div>
                  <h3 className="fv-about__feature-title">{f.title}</h3>
                  <p className="fv-about__feature-text">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
            <section className="fv-about__section fv-about__section--kiosk">
        <div className="fv-about__inner">
          <span className="fv-about__eyebrow fv-about__eyebrow--amber">
            <span aria-hidden="true">🍿</span> VÅR KIOSK &amp; FÖRBESTÄLLNING
          </span>
          <h2 className="fv-about__h2">Bio-Kiosken – Småstads bästa biogodis</h2>
          <p className="fv-about__text fv-about__text--narrow">
            Ingen bio utan färska popcorn! I vår kiosk poppar vi alltid nytt inför varje visning. För att
            du ska slippa långa köer innan filmen startar kan du förbeställa dina favoritmenyer direkt när
            du bokar din biobiljett online. Allt står packat och klart när du checkar in i kassan.
          </p>

          <div className="fv-about__kiosk-grid">
            {KIOSK.map((k) => (
              <div key={k.name} className="fv-about__kiosk-card">
                <span className="fv-about__kiosk-icon" aria-hidden="true">
                  {k.icon}
                </span>
                <h3 className="fv-about__feature-title">{k.name}</h3>
                <p className="fv-about__feature-text">{k.text}</p>
                <p className="fv-about__price">{k.price} kr</p>
              </div>
            ))}
          </div>
        </div>
      </section>
            <section className="fv-about__section">
        <div className="fv-about__inner">
          <span className="fv-about__eyebrow">VÅRA SALONGER</span>
          <h2 className="fv-about__h2">Två unika visningssalonger</h2>

          <div className="fv-about__salong-grid">
            {SALONGER.map((s) => (
              <article key={s.name} className={`fv-about__salong fv-about__salong--${s.tone}`}>
                <header className="fv-about__salong-head">
                  <div>
                    <h3 className="fv-about__salong-name">{s.name}</h3>
                    <p className="fv-about__feature-text">{s.subtitle}</p>
                  </div>
                  <div className="fv-about__salong-seats">
                    <strong>{s.seats}</strong>
                    <span>platser</span>
                  </div>
                </header>

                <div className="fv-about__salong-body">
                  <span className="fv-about__tag">{s.tag}</span>
                  <p className="fv-about__feature-text">{s.text}</p>
                  <ul className="fv-about__checks">
                    {s.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="fv-about__cta">
            <Link to="/" className="fv-about__cta-btn">
              Se dagens visningsschema →
            </Link>
          </div>
        </div>
      </section>
            <section className="fv-about__section fv-about__section--find">
        <div className="fv-about__inner">
          <span className="fv-about__eyebrow">HITTA HIT</span>
          <h2 className="fv-about__h2">Välkommen till Storgatan 14</h2>

          <div className="fv-about__find">
            <div className="fv-about__map" role="img" aria-label="Karta över Filmvisarna">
              <div className="fv-about__map-pin">
                <span className="fv-about__map-dot" aria-hidden="true">
                  📍
                </span>
                <strong>Filmvisarna</strong>
              </div>
            </div>

            <ul className="fv-about__info">
              <li className="fv-about__info-item">
                <span className="fv-about__feature-icon" aria-hidden="true">
                  📍
                </span>
                <div>
                  <span className="fv-about__info-label">ADRESS</span>
                  <p className="fv-about__info-text">Storgatan 14, Småstad</p>
                </div>
              </li>
              <li className="fv-about__info-item">
                <span className="fv-about__feature-icon" aria-hidden="true">
                  🕒
                </span>
                <div>
                  <span className="fv-about__info-label">ÖPPETTIDER</span>
                  <p className="fv-about__info-text">
                    Kassan och kiosken öppnar 45 minuter före dagens första visning
                  </p>
                </div>
              </li>
              <li className="fv-about__info-item">
                <span className="fv-about__feature-icon" aria-hidden="true">
                  🅿️
                </span>
                <div>
                  <span className="fv-about__info-label">PARKERING</span>
                  <p className="fv-about__info-text">Gratis parkering bakom biografen efter 18:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
