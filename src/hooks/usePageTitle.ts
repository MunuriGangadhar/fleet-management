import { createContext, useContext, useEffect } from 'react'

export const PageTitleContext = createContext<{
  setTitle: (title: string, subtitle?: string) => void
} | undefined>(undefined)

export function usePageTitle(title: string, subtitle?: string) {
  const ctx = useContext(PageTitleContext)
  useEffect(() => {
    ctx?.setTitle(title, subtitle)
  }, [ctx, title, subtitle])
}
