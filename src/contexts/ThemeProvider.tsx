import { createContext, useEffect, useState } from 'react'
import type { Theme, ThemeProviderState } from '@/types'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null
}

export const ThemeProvider = ({
  children,
  defaultTheme = 'system',
  storageKey = 'ele-ui-theme',
  ...props
}: ThemeProviderProps): JSX.Element => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme // eslint-disable-line @typescript-eslint/strict-boolean-expressions
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    }
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)
