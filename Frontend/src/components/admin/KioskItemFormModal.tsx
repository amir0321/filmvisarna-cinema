import { useState, type FormEvent } from 'react'
import apiClient from '../../api/client'
import type { AdminMenuItem } from '../../types'
import { Modal } from '../Modal'
import { InlineFeedback } from '../Toast'
import { KIOSK_CATEGORIES } from '../../utils/kiosk'

// Mount only while open so the form resets
interface KioskItemFormModalProps {
  // null = add a new product
  item: AdminMenuItem | null
  onClose: () => void
  onSaved: (message: string) => void
}

interface FormValues {
  name: string
  category: 'food' | 'drink'
  price: string
  description: string
  imageUrl: string
  isAvailable: boolean
}

function getInitialValues(item: AdminMenuItem | null): FormValues {
  return {
    name: item?.name ?? '',
    category: item?.category ?? 'food',
    price: item ? String(item.price) : '',
    description: item?.description ?? '',
    imageUrl: item?.imageUrl ?? '',
    isAvailable: item?.isAvailable ?? true,
  }
}

export default function KioskItemFormModal({ item, onClose, onSaved }: KioskItemFormModalProps) {
  const [values, setValues] = useState(() => getInitialValues(item))
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = item !== null
  const isCombo = item?.isCombo ?? false
  const isComplete = values.name.trim() !== '' && values.price !== ''

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isComplete) return
    setError(null)
    setIsSaving(true)

    const body = {
      name: values.name.trim(),
      price: Number(values.price),
      description: values.description.trim() || null,
      imageUrl: values.imageUrl.trim() || null,
      // Menus keep their category, it can't be changed here
      ...(isCombo ? {} : { category: values.category }),
    }

    try {
      if (isEditing) {
        await apiClient.patch(`/admin/menu-items/${item.id}`, { ...body, isAvailable: values.isAvailable })
        onSaved(`${body.name} har sparats.`)
      } else {
        const created = await apiClient.post<AdminMenuItem>('/admin/menu-items', body)
        // New products are active by default, so only update if it should start inactive
        if (!values.isAvailable) {
          await apiClient.patch(`/admin/menu-items/${created.id}`, { isAvailable: false })
        }
        onSaved(`${body.name} har lagts till.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Det gick inte att spara produkten.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? 'Redigera produkt' : 'Lägg till ny produkt'} size="md">
      <form className="admin-form" onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <InlineFeedback variant="danger" message={error} className="mb-3" />}

          <div className="mb-3">
            <label htmlFor="kiosk-name" className="admin-form__label">
              Produktnamn *
            </label>
            <input
              id="kiosk-name"
              className="form-control admin-form__input"
              placeholder="t.ex. Lilla Popcornmenyn"
              required
              maxLength={100}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label htmlFor="kiosk-category" className="admin-form__label">
                Kategori
              </label>
              <select
                id="kiosk-category"
                className="form-select admin-form__input"
                disabled={isCombo}
                value={isCombo ? 'combo' : values.category}
                onChange={(event) => update('category', event.target.value as 'food' | 'drink')}
              >
                {isCombo && <option value="combo">{KIOSK_CATEGORIES.combo.label}</option>}
                <option value="food">{KIOSK_CATEGORIES.food.label}</option>
                <option value="drink">{KIOSK_CATEGORIES.drink.label}</option>
              </select>
            </div>
            <div className="col-6">
              <label htmlFor="kiosk-price" className="admin-form__label">
                Pris (SEK) *
              </label>
              <input
                id="kiosk-price"
                type="number"
                className="form-control admin-form__input"
                required
                min={0}
                max={10000}
                step={1}
                value={values.price}
                onChange={(event) => update('price', event.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="kiosk-description" className="admin-form__label">
              Beskrivning / innehåll
            </label>
            <textarea
              id="kiosk-description"
              className="form-control admin-form__input"
              rows={2}
              maxLength={500}
              placeholder="t.ex. Varma popcorn 1.5L + valfri läsk 33cl"
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="kiosk-image" className="admin-form__label">
              Bild-URL (valfritt)
            </label>
            <input
              id="kiosk-image"
              type="url"
              className="form-control admin-form__input"
              placeholder="https://..."
              value={values.imageUrl}
              onChange={(event) => update('imageUrl', event.target.value)}
            />
          </div>

          <div className="kiosk-form__toggle">
            <div>
              <label htmlFor="kiosk-available" className="kiosk-form__toggle-title">
                Aktiv / visas i kiosken
              </label>
              <p className="kiosk-form__toggle-text">Aktiva produkter kan köpas i kassan och förbokas vid biljettköp</p>
            </div>
            <div className="form-check form-switch kiosk-switch">
              <input
                id="kiosk-available"
                type="checkbox"
                role="switch"
                className="form-check-input"
                checked={values.isAvailable}
                onChange={(event) => update('isAvailable', event.target.checked)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn admin-form__cancel" onClick={onClose} disabled={isSaving}>
            Avbryt
          </button>
          <button type="submit" className="btn btn-danger admin-form__submit" disabled={isSaving || !isComplete}>
            {isSaving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            Spara produkt
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
