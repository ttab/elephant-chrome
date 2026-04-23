const BASE_URL = import.meta.env.BASE_URL || ''

/**
 * Re-point the planning that owns `fromArticleId` as a deliverable so it
 * owns `toArticleId` instead, and optionally rewrite the matching
 * assignment's `core/assignment-type` value. Used for article→timeless
 * conversion — the server updates the planning via Hocuspocus so open Yjs
 * sessions see the change. No-op when the source has no owning planning.
 */
export async function replaceDeliverable({
  fromArticleId,
  toArticleId,
  newAssignmentType
}: {
  fromArticleId: string
  toArticleId: string
  newAssignmentType?: 'text' | 'timeless'
}): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/api/documents/${fromArticleId}/replaceDeliverable`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toArticleId, newAssignmentType })
    }
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '(unreadable)')
    throw new Error(`replaceDeliverable ${response.status}: ${body}`)
  }
}
