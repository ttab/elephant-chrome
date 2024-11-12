import { useContext } from 'react'
import { ThemeProviderContext } from '@/contexts'
import type { ThemeProviderState } from '@/types'

export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
