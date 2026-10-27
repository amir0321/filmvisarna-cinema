import { createBrowserRouter } from 'react-router'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import Movies from './pages/Movies'
import Salonger from './pages/Salonger'
import About from './pages/About'
import MyBookings from './pages/MyBookings'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminScreenings from './pages/admin/AdminScreenings'
import AdminMovies from './pages/admin/AdminMovies'
import AdminCinemas from './pages/admin/AdminCinemas'
import ScreeningDetail from './pages/ScreeningDetail'
import Booking from './pages/Booking'

export const router = createBrowserRouter([
  // Public application layout
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'movies', element: <Movies /> },
      { path: 'salonger', element: <Salonger /> },
      { path: 'om-oss', element: <About /> },
      { path: 'my-bookings', element: <MyBookings /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'profile', element: <Profile /> },
      { path: 'screeningdetail/:id', element: <ScreeningDetail /> },
      { path: 'booking/:screeningId', element: <Booking /> },
    ],
  },
  // Backoffice administration layout
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'bookings', element: <AdminBookings /> },
      { path: 'screenings', element: <AdminScreenings /> },
      { path: 'movies', element: <AdminMovies /> },
      { path: 'cinemas', element: <AdminCinemas /> },
    ],
  },
  // Catch-all 404 Not Found route
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
