import type { AdminMenuItem } from '../../types'
import { KIOSK_CATEGORIES, getKioskCategory } from '../../utils/kiosk'
import { formatSek } from '../../utils/price'

interface KioskTableProps {
  items: AdminMenuItem[]
  // Id of the item currently being saved
  savingId: number | null
  onEdit: (item: AdminMenuItem) => void
  onToggleAvailable: (item: AdminMenuItem) => void
}

export default function KioskTable({ items, savingId, onEdit, onToggleAvailable }: KioskTableProps) {
  return (
    <div className="admin-table-card">
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Bild</th>
              <th scope="col">Produktnamn</th>
              <th scope="col">Kategori</th>
              <th scope="col">Pris</th>
              <th scope="col">Lagerstatus</th>
              <th scope="col" className="text-end">
                Åtgärder
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
                    <span className="kiosk-thumb">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span aria-hidden="true">{category.emoji}</span>}
                    </span>
                  </td>
                  <th scope="row">
                    <span className="admin-table__title d-block">{item.name}</span>
                    {item.description && <span className="kiosk-table__description">{item.description}</span>}
                  </th>
                  <td>
                    <span className={`kiosk-category kiosk-category--${categoryKey}`}>{category.label}</span>
                  </td>
                  <td className="kiosk-table__price">{formatSek(item.price)}</td>
                  <td>
                    <div className="form-check form-switch kiosk-switch">
                      <input
                        id={`kiosk-available-${item.id}`}
                        type="checkbox"
                        role="switch"
                        className="form-check-input"
                        checked={item.isAvailable}
                        disabled={savingId === item.id}
                        onChange={() => onToggleAvailable(item)}
                      />
                      <label htmlFor={`kiosk-available-${item.id}`} className="form-check-label">
                        {item.isAvailable ? 'Aktiv' : 'Inaktiv'}
                        <span className="visually-hidden"> – {item.name}</span>
                      </label>
                    </div>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="btn btn-sm admin-table__edit"
                        onClick={() => onEdit(item)}
                        aria-label={`Redigera ${item.name}`}
                      >
                        <i className="bi bi-pencil-fill me-1" aria-hidden="true"></i>
                        Redigera
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
