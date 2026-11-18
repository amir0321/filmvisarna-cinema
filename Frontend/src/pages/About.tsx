import { Link } from 'react-router'
import { useTranslation } from '../context/LocaleContext'
import type { SimpleTranslationKey } from '../i18n'

const FEATURES: readonly { icon: string; titleKey: SimpleTranslationKey; textKey: SimpleTranslationKey }[] = [
  {
    icon: '🎟️',
    titleKey: 'about.feature1Title',
    textKey: 'about.feature1Text',
  },
  {
    icon: '🔊',
    titleKey: 'about.feature2Title',
    textKey: 'about.feature2Text',
  },
  {
    icon: '☕',
    titleKey: 'about.feature3Title',
    textKey: 'about.feature3Text',
  },
]
const KIOSK: readonly { icon: string; nameKey: SimpleTranslationKey; textKey: SimpleTranslationKey; price: number }[] = [
  { icon: '🍿', nameKey: 'about.kiosk1Name', textKey: 'about.kiosk1Text', price: 79 },
  { icon: '🎬', nameKey: 'about.kiosk2Name', textKey: 'about.kiosk2Text', price: 129 },
  { icon: '☕', nameKey: 'about.kiosk3Name', textKey: 'about.kiosk3Text', price: 49 },
]
const SALONGER: readonly {
  nameKey: SimpleTranslationKey
  subtitle: string
  seats: number
  tagKey: SimpleTranslationKey
  tone: 'red' | 'amber'
  textKey: SimpleTranslationKey
  pointKeys: readonly SimpleTranslationKey[]
}[] = [
  {
    nameKey: 'salonger.hall1.title',
    subtitle: 'Stora Salongen',
    seats: 80,
    tagKey: 'about.hall1Tag',
    tone: 'red',
    textKey: 'about.hall1Text',
    pointKeys: ['about.hall1Point1', 'about.hall1Point2', 'about.hall1Point3', 'about.hall1Point4'],
  },
  {
    nameKey: 'salonger.hall2.title',
    subtitle: 'Lilla Salongen',
    seats: 40,
    tagKey: 'about.hall2Tag',
    tone: 'amber',
    textKey: 'about.hall2Text',
    pointKeys: ['about.hall2Point1', 'about.hall2Point2', 'about.hall2Point3', 'about.hall2Point4'],
  },
]
export default function About() {
  const { t } = useTranslation()

  return (
    <div className="fv-about">
      <section className="fv-about__hero">
        <span className="fv-about__badge">
          <i className="bi bi-film" aria-hidden="true" /> {t('about.badge')}
        </span>
        <h1 className="fv-about__title">
          {t('about.titlePrefix')} <span className="fv-about__accent">{t('about.titleAccent')}</span>
        </h1>
        <p className="fv-about__lead">
          {t('about.lead')}
        </p>
      </section>

      <section className="fv-about__section">
        <div className="fv-about__story">
          <div>
            <span className="fv-about__eyebrow">{t('about.storyEyebrow')}</span>
            <h2 className="fv-about__h2">{t('about.storyHeading')}</h2>
            <p className="fv-about__text">
              {t('about.storyP1')}
            </p>
            <p className="fv-about__text">
              {t('about.storyP2')}
            </p>
            <p className="fv-about__text">
              {t('about.storyP3')}
            </p>
          </div>

          <div className="fv-about__features">
            {FEATURES.map((f) => (
              <div key={f.titleKey} className="fv-about__feature">
                <span className="fv-about__feature-icon" aria-hidden="true">
                  {f.icon}
                </span>
                <div>
                  <h3 className="fv-about__feature-title">{t(f.titleKey)}</h3>
                  <p className="fv-about__feature-text">{t(f.textKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="fv-about__section fv-about__section--kiosk">
        <div className="fv-about__inner">
          <span className="fv-about__eyebrow fv-about__eyebrow--amber">
            <span aria-hidden="true">🍿</span> {t('about.kioskEyebrow')}
          </span>
          <h2 className="fv-about__h2">{t('about.kioskHeading')}</h2>
          <p className="fv-about__text fv-about__text--narrow">
            {t('about.kioskText')}
          </p>

          <div className="fv-about__kiosk-grid">
            {KIOSK.map((k) => (
              <div key={k.nameKey} className="fv-about__kiosk-card">
                <span className="fv-about__kiosk-icon" aria-hidden="true">
                  {k.icon}
                </span>
                <h3 className="fv-about__feature-title">{t(k.nameKey)}</h3>
                <p className="fv-about__feature-text">{t(k.textKey)}</p>
                <p className="fv-about__price">{k.price} kr</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="fv-about__section">
        <div className="fv-about__inner">
          <span className="fv-about__eyebrow">{t('about.salongerEyebrow')}</span>
          <h2 className="fv-about__h2">{t('about.salongerHeading')}</h2>

          <div className="fv-about__salong-grid">
            {SALONGER.map((s) => (
              <article key={s.nameKey} className={`fv-about__salong fv-about__salong--${s.tone}`}>
                <header className="fv-about__salong-head">
                  <div>
                    <h3 className="fv-about__salong-name">{t(s.nameKey)}</h3>
                    <p className="fv-about__feature-text">{s.subtitle}</p>
                  </div>
                  <div className="fv-about__salong-seats">
                    <strong>{s.seats}</strong>
                    <span>{t('about.seatsUnit')}</span>
                  </div>
                </header>

                <div className="fv-about__salong-body">
                  <span className="fv-about__tag">{t(s.tagKey)}</span>
                  <p className="fv-about__feature-text">{t(s.textKey)}</p>
                  <ul className="fv-about__checks">
                    {s.pointKeys.map((pointKey) => (
                      <li key={pointKey}>{t(pointKey)}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className="fv-about__cta">
            <Link to="/" className="fv-about__cta-btn">
              {t('about.seeTodaySchedule')}
            </Link>
          </div>
        </div>
      </section>
      <section className="fv-about__section fv-about__section--find">
        <div className="fv-about__inner">
          <span className="fv-about__eyebrow">{t('about.findEyebrow')}</span>
          <h2 className="fv-about__h2">{t('about.findHeading')}</h2>

          <div className="fv-about__find">
            <div className="fv-about__map" role="img" aria-label={t('about.mapAria')}>
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
                  <span className="fv-about__info-label">{t('about.addressLabel')}</span>
                  <p className="fv-about__info-text">{t('about.addressValue')}</p>
                </div>
              </li>
              <li className="fv-about__info-item">
                <span className="fv-about__feature-icon" aria-hidden="true">
                  🕒
                </span>
                <div>
                  <span className="fv-about__info-label">{t('about.hoursLabel')}</span>
                  <p className="fv-about__info-text">
                    {t('about.hoursValue')}
                  </p>
                </div>
              </li>
              <li className="fv-about__info-item">
                <span className="fv-about__feature-icon" aria-hidden="true">
                  🅿️
                </span>
                <div>
                  <span className="fv-about__info-label">{t('about.parkingLabel')}</span>
                  <p className="fv-about__info-text">{t('about.parkingValue')}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
