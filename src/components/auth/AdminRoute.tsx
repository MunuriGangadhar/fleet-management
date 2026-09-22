import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Nested inside ProtectedRoute, so by the time this runs we already know
// session exists and profile.status === 'active' — this only adds the
// role check on top.
export function AdminRoute() {
  const { profile } = useAuth()

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
