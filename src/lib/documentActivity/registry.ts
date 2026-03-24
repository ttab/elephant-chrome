import type { ActivityDefinition, ActivityEntry, DocumentType, ActivityId } from './types'

class DocumentActivityRegistry {
  private entries = new Map<string, ActivityEntry>()
  private listeners = new Set<() => void>()
  private version = 0

  register = (docType: DocumentType, activityId: ActivityId, definition: ActivityDefinition): (() => void) => {
    const key = `${docType}::${activityId}`
    this.entries.set(key, { docType, activityId, definition })
    this.version++
    this.notifyListeners()

    return () => {
      this.entries.delete(key)
      this.version++
      this.notifyListeners()
    }
  }

  getEntries = (docType: DocumentType): ActivityEntry[] => {
    const result: ActivityEntry[] = []

    for (const entry of this.entries.values()) {
      if (entry.docType === docType || entry.docType === '*') {
        result.push(entry)
      }
    }

    return result
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  getVersion = (): number => {
    return this.version
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export const documentActivityRegistry = new DocumentActivityRegistry()
