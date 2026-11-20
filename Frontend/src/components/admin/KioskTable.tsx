import { useState } from 'react'
import { useTranslation } from '../../context/LocaleContext'
import type { AdminMenuItem } from '../../types'
import { isSafeImageUrl } from '../../utils/imageValidation'
import { KIOSK_CATEGORIES, getKioskCategory } from '../../utils/kiosk'
import { formatSek } from '../../utils/price'

interface KioskTableProps {
  items: AdminMenuItem[]
  // Id of the item currently being saved
  savingId: number | null
  onEdit: (item: AdminMenuItem) => void
  onToggleAvailable: (item: AdminMenuItem) => void
}

function KioskThumb({ imageUrl, emoji }: { imageUrl: string | null; emoji: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const canShowImage = isSafeImageUrl(imageUrl) && imageUrl !== failedUrl

  return (
    <span className="kiosk-thumb">
      {canShowImage && imageUrl ? (
        <img src={imageUrl} alt="" onError={() => setFailedUrl(imageUrl)} />
      ) : (
        <span aria-hidden="true">{emoji}</span>
      )}
    </span>
  )
}

export default function KioskTable({ items, savingId, onEdit, onToggleAvailable }: KioskTableProps) {
  const { t, locale } = useTranslation()

  const renderSwitch = (item: AdminMenuItem, idPrefix: string) => (
    <div className="form-check form-switch kiosk-switch">
      <input
        id={`${idPrefix}-${item.id}`}
        type="checkbox"
        role="switch"
        className="form-check-input"
        checked={item.isAvailable}
        disabled={savingId === item.id}
        onChange={() => onToggleAvailable(item)}
      />
      <label htmlFor={`${idPrefix}-${item.id}`} className="form-check-label">
        {t(item.isAvailable ? 'admin.kiosk.status.active' : 'admin.kiosk.status.inactive')}
        <span className="visually-hidden"> – {item.name}</span>
      </label>
    </div>
  )

  const renderEditButton = (item: AdminMenuItem) => (
    <button
      type="button"
      className="btn btn-sm admin-table__edit"
      onClick={() => onEdit(item)}
      aria-label={t('admin.kiosk.editAria', { name: item.name })}
    >
      <i className="bi bi-pencil-fill me-1" aria-hidden="true"></i>
      {t('admin.edit')}
    </button>
  )

  return (
    <div className="admin-kiosk-list">
      <div className="admin-table-card d-none d-md-block">
        <div className="table-responsive">
          <table className="admin-table">
            <caption className="visually-hidden">{t('admin.kiosk.tableCaption')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('admin.kiosk.col.image')}</th>
                <th scope="col">{t('admin.kiosk.col.name')}</th>
                <th scope="col">{t('admin.kiosk.col.category')}</th>
                <th scope="col">{t('admin.kiosk.col.price')}</th>
                <th scope="col">{t('admin.kiosk.col.status')}</th>
                <th scope="col" className="text-end">
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const categoryKey = getKioskCategory(item)
                const category = KIOSK_CATEGORIES[categoryKey]
                return (
                  <tr key={item.id}>
                    <td>
                      <KioskThumb imageUrl={item.imageUrl} emoji={category.emoji} />
                    </td>
                    <th scope="row">
                      <span className="admin-table__title d-block">{item.name}</span>
                      {item.description && <span className="kiosk-table__description">{item.description}</span>}
                    </th>
                    <td>
                      <span className={`kiosk-category kiosk-category--${categoryKey}`}>{t(category.labelKey)}</span>
                    </td>
                    <td className="kiosk-table__price">{formatSek(item.price, locale)}</td>
                    <td>{renderSwitch(item, 'kiosk-available')}</td>
                    <td>
                      <div className="admin-table__actions">{renderEditButton(item)}</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="admin-kiosk-cards d-md-none">
        {items.map((item) => {
          const categoryKey = getKioskCategory(item)
          const category = KIOSK_CATEGORIES[categoryKey]
          return (
            <li key={item.id}>
              <article className="admin-kiosk-card" aria-label={item.name}>
                <header className="admin-kiosk-card__header">
                  <KioskThumb imageUrl={item.imageUrl} emoji={category.emoji} />
                  <div className="admin-kiosk-card__heading">
                    <h3 className="admin-kiosk-card__title">{item.name}</h3>
                    {item.description && <p className="kiosk-table__description mb-0">{item.description}</p>}
                  </div>
                  <span className="kiosk-table__price">{formatSek(item.price, locale)}</span>
                </header>
                <div className="admin-kiosk-card__meta">
                  <span className={`kiosk-category kiosk-category--${categoryKey}`}>{t(category.labelKey)}</span>
                  {renderSwitch(item, 'kiosk-card-available')}
                </div>
                <div className="admin-kiosk-card__actions">{renderEditButton(item)}</div>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

