import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[var(--bg-canvas)] text-center">
      <p className="text-4xl font-bold text-[var(--text-primary)]">404</p>
      <p className="text-sm text-[var(--text-tertiary)]">This page doesn't exist.</p>
      <Link to="/dashboard">
        <Button variant="primary">Back to dashboard</Button>
      </Link>
    </div>
  )
}
