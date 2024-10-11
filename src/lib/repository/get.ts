import type { Document } from '@ttab/elephant-api/newsdoc'

const BASE_URL = import.meta.env.BASE_URL || ''

export const get = async (documentId: string): Promise<Document | null> => {
  const response = await fetch(`${BASE_URL}/api/documents/${documentId}`)
  if (!response.ok) {
    return null
  }

  return (await response.json() as Record<string, unknown>)?.document as Document || null
}
