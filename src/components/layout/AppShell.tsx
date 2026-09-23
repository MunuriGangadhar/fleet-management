import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PageTitleContext } from '@/hooks/usePageTitle'
import { useRealtimeVehicles } from '@/hooks/useRealtimeVehicles'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function AppShell() {
  const [title, setTitleState] = useState('Dashboard')
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined)
  const location = useLocation()

  useRealtimeVehicles()

  function setTitle(nextTitle: string, nextSubtitle?: string) {
    setTitleState(nextTitle)
    setSubtitle(nextSubtitle)
  }

  return (
    <PageTitleContext.Provider value={{ setTitle }}>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-canvas)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} subtitle={subtitle} />
          <main className="relative flex-1 overflow-y-auto">
            <ErrorBoundary key={location.pathname}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  )
}
