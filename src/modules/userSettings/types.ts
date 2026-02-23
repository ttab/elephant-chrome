import type { EventLogEntry, Document } from '@ttab/elephant-api/user'
export type SettingsDocumentPayload = Document['payload']
export type SettingsEventHandler = (payload: SettingsDocumentPayload) => void

export interface SettingsContextValue {
  /** Get current settings payload for a document type, returns undefined if not yet loaded */
  getSettings: (documentType: string) => SettingsDocumentPayload

  /** Set current settings for a document type */
  updateSettings: (documentType: string, payload: SettingsDocumentPayload) => Promise<void>

  /** Subscribe to settings changes for a document type */
  subscribe: (documentType: string, handler: SettingsEventHandler) => () => void
}

export type { EventLogEntry }
