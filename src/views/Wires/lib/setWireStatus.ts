import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'
import type { Wire } from '@/shared/schemas/wire'
import { getWireStatus } from '@/lib/getWireStatus'

type WireStatusName = 'draft' | 'read' | 'saved' | 'used'

export type WireStatus = {
  uuid: string
  name: WireStatusName
  version: bigint
}

type WireStatusResult = {
  uuid: string
  statusSet: boolean
}

/**
 * Updates wire statuses in bulk and returns results indicating success/failure for each wire
 */
export async function executeWiresStatuses(
  repository: Repository,
  session: Session,
  wireStatuses: WireStatus[]
): Promise<WireStatusResult[]> {
  if (!wireStatuses.length) {
    return []
  }

  if (!session.accessToken) {
    return wireStatuses.map((ws) => ({ uuid: ws.uuid, statusSet: false }))
  }

  try {
    const response = await repository.bulkSaveMeta({
      statuses: wireStatuses,
      accessToken: session.accessToken
    })

    const succeededUuids = new Set(response.updates.map((u) => u.uuid))

    return wireStatuses.map((ws) => ({
      uuid: ws.uuid,
      statusSet: succeededUuids.has(ws.uuid)
    }))
  } catch {
    return wireStatuses.map((ws) => ({ uuid: ws.uuid, statusSet: false }))
  }
}

export function calculateWireStatuses(wires: Wire[], newStatus: WireStatusName) {
  // Find out if all wires have the same status
  const currentStatuses = wires.map((wire) => getWireStatus(wire)).filter(Boolean)
  const singleValue = [...new Set(currentStatuses)].length === 1

  // Calculate next status for each wire
  const nextStatuses: WireStatus[] = []
  for (const wire of wires) {
    const currentVersion = wire.fields?.['current_version']?.values?.[0]
    const currentStatus = getWireStatus(wire)

    // Don't allow changing status of used wires
    if (!currentVersion || currentStatus === 'used') {
      continue
    }

    nextStatuses.push({
      uuid: wire.id,
      version: BigInt(currentVersion),
      // Toggle status to draft only if they all have the same status,
      // otherwise set them all to the wanted status.
      name: (newStatus === currentStatus && singleValue)
        ? 'draft'
        : newStatus
    })
  }

  return nextStatuses
}
