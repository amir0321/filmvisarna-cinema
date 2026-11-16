import { Outlet } from 'react-router'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'
import MobileDrawer from '../components/MobileDrawer'
import Navbar from '../components/Navbar'
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice'

export default function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-body text-body">
      <a href="#main-content" className="fv-skip-link">Hoppa till huvudinnehåll</a>
      <Navbar />
      <MobileDrawer />
      <EmailVerificationNotice />
      <main id="main-content" tabIndex={-1} className="flex-grow-1 container-fluid px-3 px-md-5 pt-4 public-main">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
