import { Navigate, createBrowserRouter } from 'react-router'
import RouteRedirect from './components/RouteRedirect'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import Salonger from './pages/Salonger'
import About from './pages/About'
import MyBookings from './pages/MyBookings'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Profile from './pages/Profile'
import CancelBooking from './pages/CancelBooking'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminBookings from './pages/admin/AdminBookings'
import AdminScreenings from './pages/admin/AdminScreenings'
import AdminMovies from './pages/admin/AdminMovies'
import AdminCinemas from './pages/admin/AdminCinemas'
import ScreeningDetail from './pages/ScreeningDetail'
import BookingConfirmation from './pages/BookingConfirmation'
import ConfirmGuestBooking from './pages/ConfirmGuestBooking'

export const router = createBrowserRouter([
  // Public application layout
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },

      // Filmer (Svenska primär, engelska alias/redirect)
      { path: 'filmer', element: <Movies /> },
      { path: 'filmer/:id', element: <MovieDetails /> },
      { path: 'movies', element: <Navigate to="/filmer" replace /> },
      { path: 'movies/:id', element: <MovieDetails /> },

      // Salonger & Om oss
      { path: 'salonger', element: <Salonger /> },
      { path: 'om-oss', element: <About /> },

      // Mina bokningar (Svenska primär, engelska alias/redirect)
      { path: 'mina-bokningar', element: <ProtectedRoute><MyBookings /></ProtectedRoute> },
      { path: 'my-bookings', element: <RouteRedirect to="/mina-bokningar" /> },

      // Auth & Profil (Svenska primär, engelska alias/redirect)
      { path: 'logga-in', element: <Login /> },
      { path: 'login', element: <RouteRedirect to="/logga-in" /> },
      { path: 'skapa-konto', element: <Register /> },
      { path: 'registrera', element: <RouteRedirect to="/skapa-konto" /> },
      { path: 'register', element: <RouteRedirect to="/skapa-konto" /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'profil', element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: 'profile', element: <RouteRedirect to="/profil" /> },

      // Bokning (Svenska primär, engelska/äldre alias)
      { path: 'boka/:id', element: <ScreeningDetail /> },
      { path: 'booking/:id', element: <ScreeningDetail /> },
      { path: 'screeningdetail/:id', element: <ScreeningDetail /> },

      // Avbokning
      { path: 'avboka/:token', element: <CancelBooking /> },
      { path: 'avboka', element: <CancelBooking /> },
      { path: 'cancel/:token', element: <CancelBooking /> },
      { path: 'cancel', element: <CancelBooking /> },

      // Bokningsbekräftelse
      { path: 'bekrafta-gastbokning', element: <ConfirmGuestBooking /> },
      { path: 'bekraftelse/:kod', element: <BookingConfirmation /> },
      { path: 'bekraftelse', element: <BookingConfirmation /> },
      { path: 'confirmation/:kod', element: <BookingConfirmation /> },
    ],
  },
  // Backoffice administration layout
  {
    path: '/admin',
    element: <ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      // Bokningar
      { path: 'bokningar', element: <AdminBookings /> },
      { path: 'bookings', element: <AdminBookings /> },
      // Schema / Visningar
      { path: 'visningar', element: <AdminScreenings /> },
      { path: 'schema', element: <AdminScreenings /> },
      { path: 'screenings', element: <AdminScreenings /> },
      // Filmer
      { path: 'filmer', element: <AdminMovies /> },
      { path: 'movies', element: <AdminMovies /> },
      // Salonger
      { path: 'salonger', element: <AdminCinemas /> },
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
