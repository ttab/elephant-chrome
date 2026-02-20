import { useCallback, useContext, useEffect, useState } from 'react'
import { SettingsContext } from './SettingsContext'
import type { SettingsDocument } from './types'

/**
 * Subscribe to settings for a specific document type.
 * Returns the current settings and loading state.
 *
 * Automatically triggers initial fetch on first use per document type
 * and re-renders when settings are updated via the event log.
 *
 * @example
 * const { settings, isLoading } = useSettings('core://article')
 */
export function useSettings(documentType: string): {
  settings: SettingsDocument | undefined
  isLoading: boolean
  updateSettings: (settings: SettingsDocument) => Promise<void>
} {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }

  const [settings, setSettings] = useState<SettingsDocument | undefined>(
    () => context.getSettings(documentType)
  )
  const [isLoading, setIsLoading] = useState(
    () => !context.getSettings(documentType)
  )

  const handleUpdate = useCallback((updated: SettingsDocument | undefined) => {
    setSettings(updated)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!context.getSettings(documentType)) {
      setIsLoading(true)
    }
    return context.subscribe(documentType, handleUpdate)
  }, [context, documentType, handleUpdate])

  const updateSettings = useCallback(async (updated: SettingsDocument) => {
    return context.updateSettings(documentType, updated)
  }, [context, documentType])

  return { settings, isLoading, updateSettings }
}
