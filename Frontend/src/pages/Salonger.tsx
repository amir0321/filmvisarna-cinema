import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from '../context/LocaleContext'
import { useCinemas } from '../hooks/useCinemas'
import type { SimpleTranslationKey, Translator } from '../i18n'
import { translateApiError } from '../i18n/mappers'
import { MiniAuditoriumMap } from '../components/MiniAuditoriumMap'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'

// Fixed texts from the design. The order matches the backend (Stora = first, Lilla = second).
const SALONG_INFO: readonly {
  titleKey: SimpleTranslationKey
  tone: 'primary' | 'success'
  labelKey: SimpleTranslationKey
  image: string
  tagKeys: readonly SimpleTranslationKey[]
  pointKeys: readonly SimpleTranslationKey[]
}[] = [
  {
    titleKey: 'salonger.hall1.title',
    tone: 'primary',
    labelKey: 'salonger.hall1.label',
    image: '/images/hall-large.webp',
    tagKeys: ['salonger.hall1.tag1', 'salonger.hall1.tag2'],
    pointKeys: [
      'salonger.hall1.point1',
      'salonger.hall1.point2',
      'salonger.hall1.point3',
      'salonger.hall1.point4',
      'salonger.hall1.point5',
    ],
  },
  {
    titleKey: 'salonger.hall2.title',
    tone: 'success',
    labelKey: 'salonger.hall2.label',
    image: '/images/hall-small.webp',
    tagKeys: ['salonger.hall2.tag1', 'salonger.hall2.tag2'],
    pointKeys: [
      'salonger.hall2.point1',
      'salonger.hall2.point2',
      'salonger.hall2.point3',
      'salonger.hall2.point4',
      'salonger.hall2.point5',
    ],
  },
]

// "18×8 m" from the backend -> "18 × 8 m duk" / "18 × 8 m screen" as in the design
function formatScreen(size: string | null, t: Translator) {
  return size ? t('salonger.screenSize', { size: size.replace('×', ' × ') }) : '–'
}

export default function Salonger() {
  const { t, locale } = useTranslation()
  const { data, loading, error, refetch } = useCinemas()
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({})

  return (
    <div className="fv-salonger full-bleed">
      <section className="fv-salonger__hero">
        <div className="fv-salonger__hero-inner">
          <span className="fv-salonger__badge">{t('salonger.badge')}</span>
          <h1 className="fv-salonger__title">{t('salonger.title')}</h1>
          <p className="fv-salonger__lead">
            {t('salonger.lead')}
          </p>
        </div>
      </section>

      <section className="fv-salonger__cards">
        {loading &&
          [0, 1].map((index) => (
            <div key={index} className="fv-salonger__card" role="status" aria-busy="true">
              <span className="visually-hidden">{t('salonger.loading')}</span>
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
              title={t('salonger.errorTitle')}
              description={translateApiError(error, locale)}
              actionLabel={t('common.retry')}
              onAction={refetch}
            />
          </div>
        )}

        {!loading && !error && (!data || data.length === 0) && (
          <div className="fv-salonger__state">
            <EmptyState
              icon="bi-display"
              title={t('salonger.emptyTitle')}
              description={t('salonger.emptyDescription')}
              actionLabel={t('common.retry')}
              onAction={refetch}
            />
          </div>
        )}

        {!loading &&
          !error &&
          data?.map((cinema, i) => {
            const info = SALONG_INFO[i]
            if (!info) return null
            const title = t(info.titleKey)

            return (
              <article
                key={cinema.id}
                className={`fv-salonger__card fv-salonger__card--${info.tone}`}
              >
                <div className="fv-salonger__media">
                  {!failedImages[cinema.id] && (
                    <img
                      src={info.image}
                      alt={`${title} – ${cinema.name}`}
                      className="fv-salonger__media-img"
                      loading="lazy"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [cinema.id]: true }))
                      }
                    />
                  )}
                  <span className="fv-salonger__pill fv-salonger__pill--dark fv-salonger__media-top">
                    {t(info.labelKey)}
                  </span>
                  <div className="fv-salonger__media-bottom">
                    <span className="fv-salonger__pill fv-salonger__pill--solid">
                      {t('salonger.seatsCount', { count: cinema.total_seats })}
                    </span>
                    {info.tagKeys.map((tagKey) => (
                      <span key={tagKey} className="fv-salonger__pill">
                        {t(tagKey)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="fv-salonger__body">
                  <div className="fv-salonger__head">
                    <div>
                      <h2 className="fv-salonger__name">{title}</h2>
                      <p className="fv-salonger__sub">{cinema.name}</p>
                    </div>
                    <span className="fv-salonger__access">
                      <i className="bi bi-person-wheelchair" aria-hidden="true" /> {t('salonger.accessible')}
                    </span>
                  </div>

                  <ul className="fv-salonger__points">
                    {info.pointKeys.map((pointKey) => (
                      <li key={pointKey}>{t(pointKey)}</li>
                    ))}
                  </ul>
                  <MiniAuditoriumMap seats={cinema.seats} />
                  <Link to="/" className="fv-salonger__cta">
                    {t('salonger.seeSchedule')}
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
              <h3 className="fv-salonger__info-title">{t('salonger.accessibilityTitle')}</h3>
              <p className="fv-salonger__info-text">
                {t('salonger.accessibilityText')}
              </p>
              <ul className="fv-salonger__info-list">
                <li>{t('salonger.accessibilityItem1')}</li>
                <li>{t('salonger.accessibilityItem2')}</li>
                <li>{t('salonger.accessibilityItem3')}</li>
                <li>{t('salonger.accessibilityItem4')}</li>
              </ul>
            </div>

            <div>
              <h3 className="fv-salonger__info-title">{t('salonger.screenPlacementTitle')}</h3>
              <p className="fv-salonger__info-text">
                {t('salonger.screenPlacementText')}
              </p>
              <div className="fv-salonger__facts">
                {data.map((c) => (
                  <div key={c.id} className="fv-salonger__fact">
                    <span>{c.name}</span>
                    <strong>{formatScreen(c.screen_size, t)}</strong>
                  </div>
                ))}
                <div className="fv-salonger__fact">
                  <span>{t('salonger.optimalRowLabel')}</span>
                  <strong>{t('salonger.optimalRowValue')}</strong>
                </div>
                <div className="fv-salonger__fact">
                  <span>{t('salonger.openedYearLabel')}</span>
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
