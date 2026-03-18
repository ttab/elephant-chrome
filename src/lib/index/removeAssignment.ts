const BASE_URL = import.meta.env.BASE_URL || ''

/**
 * Remove an assignment (identified by its deliverable) from a planning item.
 * Used to roll back a partially created article when saving the article fails.
 */
export async function removeAssignmentWithDeliverable(
  planningId: string,
  deliverableId: string,
  deliverableType: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/documents/${planningId}/removeassignment/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ deliverableId, deliverableType })
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '(unreadable)')
    throw new Error(`Failed to remove assignment from planning ${planningId}: ${response.status} ${body}`)
  }
}
