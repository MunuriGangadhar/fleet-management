import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time exceptions in a page (a malformed API response, a
 * bad date, whatever) so one broken page shows a recoverable error card
 * instead of taking down the whole app to a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in page render:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertOctagon size={32} className="text-[var(--danger)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Something went wrong rendering this page
          </p>
          <p className="max-w-sm text-xs text-[var(--text-tertiary)]">
            {this.state.error.message}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={13} />}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
