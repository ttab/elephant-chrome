import { useContext } from 'react'
import { type ThemeProviderState, ThemeProviderContext } from '@/contexts/ThemeProvider'
export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) { throw new Error('useTheme must be used within a ThemeProvider') }

  return context
}
