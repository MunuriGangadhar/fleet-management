import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AccountStatusScreen } from './AccountStatusScreen'

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-canvas)]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
    </div>
  )
}

export function ProtectedRoute() {
  const { session, profile, loading, profileLoading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenSpinner />

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Session exists but the profile row hasn't loaded yet — avoid a flash of
  // the "pending approval" screen before we actually know the real status.
  if (profileLoading || !profile) return <FullScreenSpinner />

  if (profile.status !== 'active') {
    return <AccountStatusScreen profile={profile} />
  }

  return <Outlet />
}
