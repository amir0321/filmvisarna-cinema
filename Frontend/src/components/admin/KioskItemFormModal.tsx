import { useState, type FormEvent } from 'react'
import { createAdminMenuItem, updateAdminMenuItem } from '../../api/kiosk'
import { useTranslation } from '../../context/LocaleContext'
import { translateApiError } from '../../i18n/mappers'
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
  const { t, locale } = useTranslation()
  const [values, setValues] = useState(() => getInitialValues(item))
  const [createdItem, setCreatedItem] = useState<AdminMenuItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const targetItem = item ?? createdItem
  const isEditing = item !== null
  const isCombo = targetItem?.isCombo ?? false
  const isComplete = values.name.trim() !== '' && values.price !== ''

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isComplete || isSaving) return
    setError(null)
    setIsSaving(true)

    const baseBody = {
      name: values.name.trim(),
      price: Number(values.price),
      description: values.description.trim() || null,
      imageUrl: values.imageUrl.trim() || null,
    }

    try {
      if (targetItem) {
        await updateAdminMenuItem(targetItem.id, {
          ...baseBody,
          ...(isCombo ? {} : { category: values.category }),
          isAvailable: values.isAvailable,
        })
        onSaved(t(isEditing ? 'admin.kiosk.modal.saved' : 'admin.kiosk.modal.added', { name: baseBody.name }))
      } else {
        const created = await createAdminMenuItem({
          ...baseBody,
          category: values.category,
        })
        setCreatedItem(created)
        // New products are active by default, so only update if it should start inactive
        if (!values.isAvailable) {
          await updateAdminMenuItem(created.id, { isAvailable: false })
        }
        onSaved(t('admin.kiosk.modal.added', { name: baseBody.name }))
      }
    } catch (err) {
      setError(
        err instanceof Error ? translateApiError(err.message, locale) : t('admin.kiosk.modal.error'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={isSaving ? () => {} : onClose}
      title={t(isEditing ? 'admin.kiosk.modal.editTitle' : 'admin.kiosk.modal.addTitle')}
      size="md"
    >
      <form className="admin-form" onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <InlineFeedback variant="danger" message={error} className="mb-3" />}

          <div className="mb-3">
            <label htmlFor="kiosk-name" className="admin-form__label">
              {t('admin.kiosk.modal.nameLabel')}
            </label>
            <input
              id="kiosk-name"
              className="form-control admin-form__input"
              placeholder={t('admin.kiosk.modal.namePlaceholder')}
              required
              maxLength={100}
              value={values.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label htmlFor="kiosk-category" className="admin-form__label">
                {t('admin.kiosk.modal.categoryLabel')}
              </label>
              <select
                id="kiosk-category"
                className="form-select admin-form__input"
                disabled={isCombo}
                value={isCombo ? 'combo' : values.category}
                onChange={(event) => update('category', event.target.value as 'food' | 'drink')}
              >
                {isCombo && <option value="combo">{t(KIOSK_CATEGORIES.combo.labelKey)}</option>}
                <option value="food">{t(KIOSK_CATEGORIES.food.labelKey)}</option>
                <option value="drink">{t(KIOSK_CATEGORIES.drink.labelKey)}</option>
              </select>
            </div>
            <div className="col-6">
              <label htmlFor="kiosk-price" className="admin-form__label">
                {t('admin.kiosk.modal.priceLabel')}
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
              {t('admin.kiosk.modal.descriptionLabel')}
            </label>
            <textarea
              id="kiosk-description"
              className="form-control admin-form__input"
              rows={2}
              maxLength={500}
              placeholder={t('admin.kiosk.modal.descriptionPlaceholder')}
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="kiosk-image" className="admin-form__label">
              {t('admin.kiosk.modal.imageLabel')}
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
                {t('admin.kiosk.modal.availableTitle')}
              </label>
              <p className="kiosk-form__toggle-text">{t('admin.kiosk.modal.availableHint')}</p>
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
            {t('admin.abort')}
          </button>
          <button type="submit" className="btn btn-danger admin-form__submit" disabled={isSaving || !isComplete}>
            {isSaving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {t(isSaving ? 'admin.saving' : 'admin.kiosk.modal.save')}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

