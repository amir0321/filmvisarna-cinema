import type { ComponentType } from 'react'
import { Navigate, Outlet, createBrowserRouter } from 'react-router'
import RouteLoading from './components/RouteLoading'
import RouteRedirect from './components/RouteRedirect'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import Movies from './pages/Movies'
import NotFound from './pages/NotFound'

const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

export const router = createBrowserRouter([
  // Public application layout
  {
    path: '/',
    element: <PublicLayout />,
    HydrateFallback: RouteLoading,
    children: [
      { index: true, element: <Home /> },

      // Filmer (Svenska primär, engelska alias/redirect)
      { path: 'filmer', element: <Movies /> },
      { path: 'filmer/:id', lazy: lazyPage(() => import('./pages/MovieDetails')) },
      { path: 'movies', element: <Navigate to="/filmer" replace /> },
      { path: 'movies/:id', lazy: lazyPage(() => import('./pages/MovieDetails')) },

      // Salonger & Om oss
      { path: 'salonger', lazy: lazyPage(() => import('./pages/Salonger')) },
      { path: 'om-oss', lazy: lazyPage(() => import('./pages/About')) },

      // Mina bokningar (Svenska primär, engelska alias/redirect)
      {
        path: 'mina-bokningar',
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [{ index: true, lazy: lazyPage(() => import('./pages/MyBookings')) }],
      },
      { path: 'my-bookings', element: <RouteRedirect to="/mina-bokningar" /> },

      // Auth & Profil (Svenska primär, engelska alias/redirect)
      { path: 'logga-in', lazy: lazyPage(() => import('./pages/Login')) },
      { path: 'login', element: <RouteRedirect to="/logga-in" /> },
      { path: 'skapa-konto', lazy: lazyPage(() => import('./pages/Register')) },
      { path: 'registrera', element: <RouteRedirect to="/skapa-konto" /> },
      { path: 'register', element: <RouteRedirect to="/skapa-konto" /> },
      { path: 'reset-password', lazy: lazyPage(() => import('./pages/ResetPassword')) },
      { path: 'verify-email', lazy: lazyPage(() => import('./pages/VerifyEmail')) },
      {
        path: 'profil',
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [{ index: true, lazy: lazyPage(() => import('./pages/Profile')) }],
      },
      { path: 'profile', element: <RouteRedirect to="/profil" /> },

      // Bokning (Svenska primär, engelska/äldre alias)
      { path: 'boka/:id', lazy: lazyPage(() => import('./pages/ScreeningDetail')) },
      { path: 'booking/:id', lazy: lazyPage(() => import('./pages/ScreeningDetail')) },
      { path: 'screeningdetail/:id', lazy: lazyPage(() => import('./pages/ScreeningDetail')) },

      // Avbokning
      { path: 'avboka/:token', lazy: lazyPage(() => import('./pages/CancelBooking')) },
      { path: 'avboka', lazy: lazyPage(() => import('./pages/CancelBooking')) },
      { path: 'cancel/:token', lazy: lazyPage(() => import('./pages/CancelBooking')) },
      { path: 'cancel', lazy: lazyPage(() => import('./pages/CancelBooking')) },

      // Bokningsbekräftelse
      { path: 'bekrafta-gastbokning', lazy: lazyPage(() => import('./pages/ConfirmGuestBooking')) },
      { path: 'bekraftelse/:kod', lazy: lazyPage(() => import('./pages/BookingConfirmation')) },
      { path: 'bekraftelse', lazy: lazyPage(() => import('./pages/BookingConfirmation')) },
      { path: 'confirmation/:kod', lazy: lazyPage(() => import('./pages/BookingConfirmation')) },
    ],
  },
  // Backoffice administration layout
  {
    path: '/admin',
    HydrateFallback: RouteLoading,
    element: <ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, lazy: lazyPage(() => import('./pages/admin/AdminDashboard')) },
      // Bokningar
      { path: 'bokningar', lazy: lazyPage(() => import('./pages/admin/AdminBookings')) },
      { path: 'bookings', lazy: lazyPage(() => import('./pages/admin/AdminBookings')) },
      // Schema / Visningar
      { path: 'visningar', lazy: lazyPage(() => import('./pages/admin/AdminScreenings')) },
      { path: 'schema', lazy: lazyPage(() => import('./pages/admin/AdminScreenings')) },
      { path: 'screenings', lazy: lazyPage(() => import('./pages/admin/AdminScreenings')) },
      // Filmer
      { path: 'filmer', lazy: lazyPage(() => import('./pages/admin/AdminMovies')) },
      { path: 'movies', lazy: lazyPage(() => import('./pages/admin/AdminMovies')) },
      // Salonger
      { path: 'salonger', lazy: lazyPage(() => import('./pages/admin/AdminCinemas')) },
      { path: 'cinemas', lazy: lazyPage(() => import('./pages/admin/AdminCinemas')) },
    ],
  },
  // Catch-all 404 Not Found route
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
