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
 * Updates wire statuses and returns results indicating success/failure for each wire
 */
export async function executeWiresStatuses(
  repository: Repository,
  session: Session,
  wireStatuses: WireStatus[]
): Promise<WireStatusResult[]> {
  const results = await Promise.allSettled(
    wireStatuses.map((wireStatus) =>
      setWireStatus(repository, session, wireStatus)
        .then(() => ({ uuid: wireStatus.uuid, statusSet: true }))
        .catch(() => ({ uuid: wireStatus.uuid, statusSet: false }))
    )
  )

  return results.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : { uuid: '', statusSet: false }
  )
}

async function setWireStatus(repository: Repository, session: Session, status: WireStatus) {
  if (!repository || !session.accessToken) {
    throw new Error('Repository or session access token is not available')
  }

  await repository.saveMeta({
    status,
    currentStatus: undefined,
    accessToken: session.accessToken
  })
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
