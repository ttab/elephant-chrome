import type { Session } from 'next-auth'
import type { Repository } from '@/shared/Repository'

type WireStatusName = 'draft' | 'read' | 'saved' | 'used'
type WireStatus = {
  uuid: string
  name: WireStatusName
  version: bigint
}

export async function setWireStatus(repository: Repository, session: Session, status: WireStatus) {
  if (!repository || !session.accessToken) {
    throw new Error('Repository or session access token is not available')
  }

  await repository.saveMeta({
    status,
    currentStatus: undefined,
    accessToken: session.accessToken
  })
}
