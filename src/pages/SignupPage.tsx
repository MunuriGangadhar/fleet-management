import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, Eye, EyeOff, ArrowRight, MailCheck, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { FleetScene } from '@/components/auth/FleetScene'

export default function SignupPage() {
  const { session, signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<'confirm-email' | 'pending-approval' | null>(null)

  if (session && !submitted) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signUp(email, password, fullName)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSubmitted(result.needsEmailConfirmation ? 'confirm-email' : 'pending-approval')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-canvas)] px-4">
      <FleetScene />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8 flex flex-col items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-[0_8px_24px_-4px_color-mix(in_srgb,var(--accent)_60%,transparent)]">
            <Truck size={24} />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">FleetPulse</h1>
            <p className="text-sm text-[var(--text-tertiary)]">Request operator access</p>
          </div>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-surface)_88%,transparent)] p-6 text-center shadow-2xl backdrop-blur-xl"
          >
            {submitted === 'confirm-email' ? (
              <>
                <MailCheck className="mx-auto mb-3 text-[var(--accent)]" size={28} />
                <p className="text-sm font-medium text-[var(--text-primary)]">Check your email</p>
                <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                  We sent a confirmation link to <b>{email}</b>. Once confirmed, sign in — your
                  account will be waiting for an admin to approve it before you can see any fleet
                  data.
                </p>
              </>
            ) : (
              <>
                <ShieldCheck className="mx-auto mb-3 text-[var(--accent)]" size={28} />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Account created — pending approval
                </p>
                <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                  An administrator needs to approve <b>{email}</b> before it can access the
                  dashboard. You can sign in now to check your status.
                </p>
              </>
            )}
            <Link to="/login" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">
                Back to sign in
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-surface)_88%,transparent)] p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Full name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="Jane Operator"
                autoComplete="name"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 pr-9 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="mb-3 text-xs text-[var(--danger)]">{error}</p>}

            <p className="mb-3 mt-3 text-[11px] text-[var(--text-tertiary)]">
              New accounts start out <b>pending</b> — an admin has to approve you from the Admin
              panel before you can see any fleet data.
            </p>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
                icon={!loading ? <ArrowRight size={14} /> : undefined}
              >
                Request access
              </Button>
            </motion.div>

            <p className="mt-4 text-center text-xs text-[var(--text-tertiary)]">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[var(--accent)]">
                Sign in
              </Link>
            </p>
          </motion.form>
        )}
      </motion.div>
    </div>
  )
}
