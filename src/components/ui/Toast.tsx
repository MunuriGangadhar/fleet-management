import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<{ push: (kind: ToastKind, message: string) => void } | undefined>(
  undefined,
)

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
}

const COLORS: Record<ToastKind, string> = {
  success: 'var(--success)',
  error: 'var(--danger)',
  info: 'var(--info)',
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, kind, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-in pointer-events-auto flex items-center gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-raised)] px-3.5 py-2.5 text-sm shadow-lg"
            style={{ color: COLORS[t.kind] }}
          >
            {ICONS[t.kind]}
            <span className="text-[var(--text-primary)]">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className={cn('ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]')}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.push
}
