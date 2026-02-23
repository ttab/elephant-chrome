import type { EventLogEntry, Document } from '@ttab/elephant-api/user'
export type SettingsDocument = Document
export type SettingsDocumentPayload = Document['payload']
export type SettingsEventHandler = (settings: SettingsDocument | undefined) => void

export interface SettingsContextValue {
  /** Get current settings for a document type, returns undefined if not yet loaded */
  getSettings: (documentType: string) => SettingsDocument | undefined

  /** Set current settings for a document type */
  updateSettings: (documentType: string, settings: SettingsDocumentPayload) => Promise<void>

  /** Subscribe to settings changes for a document type */
  subscribe: (documentType: string, handler: SettingsEventHandler) => () => void
}

export type { EventLogEntry }
