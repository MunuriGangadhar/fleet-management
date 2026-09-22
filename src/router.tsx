import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { PageLoader } from '@/components/ui/PageLoader'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const VehicleDetailPage = lazy(() => import('@/pages/VehicleDetailPage'))
const TripDetailPage = lazy(() => import('@/pages/TripDetailPage'))
const AlertsPage = lazy(() => import('@/pages/AlertsPage'))
const DriversPage = lazy(() => import('@/pages/DriversPage'))
const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: withSuspense(<LoginPage />) },
  { path: '/signup', element: withSuspense(<SignupPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: withSuspense(<DashboardPage />) },
          { path: '/vehicles/:id', element: withSuspense(<VehicleDetailPage />) },
          { path: '/vehicles/:id/trips/:tripId', element: withSuspense(<TripDetailPage />) },
          { path: '/alerts', element: withSuspense(<AlertsPage />) },
          { path: '/drivers', element: withSuspense(<DriversPage />) },
          {
            element: <AdminRoute />,
            children: [{ path: '/admin/users', element: withSuspense(<AdminUsersPage />) }],
          },
        ],
      },
    ],
  },
  { path: '*', element: withSuspense(<NotFoundPage />) },
])
