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

/**
 * FIXME:
 * This function should return a promise that resolves with a list of uuid and true/false
 * depending on whether the status update was successful.
 */
export function executeWiresStatuses(repository: Repository, session: Session, wireStatuses: WireStatus[]) {
  for (const wireStatus of wireStatuses) {
    void setWireStatus(repository, session, wireStatus)
  }
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
