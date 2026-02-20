import { createContext } from 'react'
import type { SettingsContextValue } from './types'

export const SettingsContext = createContext<SettingsContextValue | null>(null)
