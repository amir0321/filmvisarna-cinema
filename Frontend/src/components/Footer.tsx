import { useTranslation } from '../context/LocaleContext'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Modal } from './Modal'

interface FooterProps {
  onOpenCookieSettings?: () => void
}

export default function Footer({ onOpenCookieSettings }: FooterProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [openInfo, setOpenInfo] = useState<'privacy' | 'cookies' | null>(null)

  function openCookieSettings() {
    if (onOpenCookieSettings) {
      onOpenCookieSettings()
      return
    }
    setOpenInfo('cookies')
  }

  return (
    <>
      <footer className="public-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <span className="footer-brand-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" focusable="false">
                    <path d="M18 4V2H6v2H4v16h2v2h12v-2h2V4h-2ZM8 4h8v7H8V4ZM6 18H4v-2h2v2Zm0-4H4v-2h2v2Zm0-4H4V8h2v2Zm0-4H4V4h2v2Zm10 14H8v-7h8v7Zm4-2h-2v-2h2v2Zm0-4h-2v-2h2v2Zm0-4h-2V8h2v2Zm0-4h-2V4h2v2Z" />
                  </svg>
                </span>
                <span className="footer-brand-title">FILMVISARNA Småstad</span>
              </div>
              <address className="footer-text mb-0">
                Stortorget 12<br />
                572 31 Småstad<br />
                {t('footer.phone')}: 0491-123 45
              </address>
            </div>

            <div>
              <h2 className="footer-heading">{t('footer.hours')}</h2>
              <p className="footer-text mb-0">
                {t('footer.monThu')}: 13.00–23.00<br />
                {t('footer.friSat')}: 11.00–01.00<br />
                {t('footer.sun')}: 11.00–22.00
              </p>
            </div>

            <div>
              <h2 className="footer-heading">{t('footer.information')}</h2>
              <p className="footer-notice mb-0">
                {t('footer.payment')}
              </p>
              <nav className="footer-links" aria-label={t('footer.links')}>
                <Link to="/avboka" className="footer-link">{t('footer.cancelBooking')}</Link>
                <button type="button" className="footer-link" onClick={() => setOpenInfo('privacy')}>
                  {t('footer.privacy')}
                </button>
                <button type="button" className="footer-link" onClick={openCookieSettings}>
                  {t('footer.cookies')}
                </button>
                {user?.role === 'admin' ? (
                  <Link to="/admin" className="footer-link footer-link-admin">{t('footer.admin')}</Link>
                ) : null}
              </nav>
            </div>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={openInfo !== null}
        onClose={() => setOpenInfo(null)}
        title={t(openInfo === 'privacy' ? 'footer.privacy' : 'footer.cookies')}
      >
        <Modal.Body>
          {openInfo === 'privacy' ? (
            <>
              <p>{t('footer.privacyBooking')}</p>
              <p>{t('footer.privacyAccount')}</p>
              <p className="mb-0">{t('footer.privacyContact')}</p>
            </>
          ) : (
            <>
              <p>{t('footer.cookieSession')}</p>
              <p>{t('footer.cookieBooking')}</p>
              <p>{t('footer.cookiePreferences')}</p>
              <p className="mb-0">{t('footer.cookieOptional')}</p>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}
