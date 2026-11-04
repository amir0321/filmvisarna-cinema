import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Modal } from './Modal'

interface FooterProps {
  onOpenCookieSettings?: () => void
}

export default function Footer({ onOpenCookieSettings }: FooterProps) {
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
                Tel: 0491-123 45
              </address>
            </div>

            <div>
              <h2 className="footer-heading">Öppettider</h2>
              <p className="footer-text mb-0">
                Mån–Tor: 13.00–23.00<br />
                Fre–Lör: 11.00–01.00<br />
                Sön: 11.00–22.00
              </p>
            </div>

            <div>
              <h2 className="footer-heading">Information</h2>
              <p className="footer-notice mb-0">
                Betalning sker alltid på plats i kassan vid ankomst.
              </p>
              <nav className="footer-links" aria-label="Sidfotslänkar">
                <button type="button" className="footer-link" onClick={() => setOpenInfo('privacy')}>
                  Integritetspolicy
                </button>
                <button type="button" className="footer-link" onClick={openCookieSettings}>
                  Cookie-inställningar
                </button>
                {user?.role === 'admin' ? (
                  <Link to="/admin" className="footer-link footer-link-admin">Admin</Link>
                ) : null}
              </nav>
            </div>
          </div>
        </div>
      </footer>

      <Modal
        isOpen={openInfo !== null}
        onClose={() => setOpenInfo(null)}
        title={openInfo === 'privacy' ? 'Integritetspolicy' : 'Cookie-inställningar'}
      >
        <Modal.Body>
          {openInfo === 'privacy' ? (
            <>
              <p>
                Filmvisarna använder din e-postadress och dina bokningsuppgifter för att
                hantera din bokning och skicka bokningsbekräftelse och avbokningslänk.
              </p>
              <p>
                När du blir medlem sparas dina kontouppgifter för att du ska kunna logga
                in och se dina bokningar. Ditt lösenord skickas aldrig tillbaka till webbläsaren.
              </p>
              <p className="mb-0">
                Har du frågor om dina personuppgifter? Kontakta biografen på 0491-123 45.
              </p>
            </>
          ) : (
            <>
              <p>
                Filmvisarnas inloggning använder lokal lagring i webbläsaren (localStorage),
                inte sessions- eller autentiseringscookies. Inloggningsuppgiften tas bort
                när du loggar ut.
              </p>
              <p>
                Din bokningsbekräftelse sparas tillfälligt i flikens sessionslagring
                (sessionStorage) så att du kan läsa den när du laddar om sidan.
              </p>
              <p className="mb-0">
                Appen använder inga valfria analys- eller marknadsföringscookies. Det finns
                därför inga cookie-val att ändra här. Du kan rensa webbplatsens lagrade
                uppgifter i webbläsarens inställningar.
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}
