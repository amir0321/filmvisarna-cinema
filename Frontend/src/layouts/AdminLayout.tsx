import { Outlet } from 'react-router'
import BottomNav from '../components/BottomNav'
import MobileDrawer from '../components/MobileDrawer'
import Navbar from '../components/Navbar'

export default function AdminLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      <Navbar />
      <MobileDrawer />

      <main className="flex-grow-1 container-fluid px-3 px-md-5 pt-4 public-main">
        <Outlet />
      </main>

      <footer className="py-4 border-top border-secondary border-opacity-25 bg-card text-secondary text-center small public-footer">
        <div className="container">
          <p className="mb-1 text-light">Filmvisarna Cinema &bull; Stortorget 12, Småstad</p>
          <p className="mb-0">Betalning sker alltid på plats i kassan vid ankomst.</p>
        </div>
      </footer>
      <BottomNav />
    </div>
  )
}
