import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'
import type { Wire } from '@/shared/schemas/wire'
import { getWireStatus } from '@/lib/getWireStatus'

type WireStatusName = 'draft' | 'read' | 'saved' | 'used'
type WireStatus = {
  uuid: string
  name: WireStatusName
  version: bigint
}
export function setWiresStatuses(repository: Repository, session: Session, wires: Wire[], newStatus: WireStatusName) {
  // Find out if all wires have the same status
  const versions = wires.map((wire) => getWireStatus(wire)).filter(Boolean)
  const singleValue = [...new Set(versions)].length === 1

  for (const wire of wires) {
    // Don't allow changing status of used wires
    const currentVersion = wire.fields?.['current_version']?.values?.[0]
    const currentStatus = getWireStatus(wire)
    if (!currentVersion || currentStatus === 'used') {
      continue
    }

    void setWireStatus(repository, session, {
      uuid: wire.id,
      version: BigInt(currentVersion),
      // Toggle status to draft only if they all have the same status,
      // otherwise set them all to the wanted status.
      name: (newStatus === currentStatus && singleValue)
        ? 'draft'
        : newStatus
    })
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
