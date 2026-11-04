import { Outlet } from 'react-router'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'
import MobileDrawer from '../components/MobileDrawer'
import Navbar from '../components/Navbar'
import EmailVerificationNotice from '../components/auth/EmailVerificationNotice'

export default function AdminLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      <Navbar />
      <MobileDrawer />
      <EmailVerificationNotice />

      <main className="flex-grow-1 container-fluid px-3 px-md-5 pt-4 public-main">
        <Outlet />
      </main>

      <Footer />
      <BottomNav />
    </div>
  )
}
