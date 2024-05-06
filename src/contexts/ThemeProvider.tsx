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
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setThemeOnDocument(root, systemTheme)
      // root.classList.add(systemTheme)
      return
    }

    // root.classList.add(theme)
    setThemeOnDocument(root, theme)
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

/**
 * Set theme class and data attributes on document root element for both elephant-chrome and textbit.
 *
 * @param root
 * @param theme
 */
function setThemeOnDocument(root: HTMLElement, theme: Theme): void {
  // Set theme for elephant-chrome
  root.classList.add(theme)

  // Make textbit aware of chosen theme
  root.setAttribute('data-theme', theme)
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)
