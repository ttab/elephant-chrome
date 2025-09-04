import type { Repository } from '@/shared/Repository'
import type { HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'

type DeliverablesNewsvalues = Array<{ id: string | undefined, newsvalue: string | undefined }>

/**
 * Get all deliverable uuids, in order to get the respective newsvalue for each assignment
 */

export const getNewsValues = async (hits: HitV1[], repository: Repository | undefined, session: Session | null): Promise<DeliverablesNewsvalues> => {
  const deliverableUuids: Array<{ uuid: string }> = []

  if (!session?.accessToken || !repository) {
    return []
  }

  hits.forEach((hit) => {
    if (!hit.document) {
      return []
    }

    const { meta } = hit.document
    meta?.forEach((_meta) => {
      const deliverable = _meta.links.find((l) => l.rel === 'deliverable')
      const _deliverableId: string | undefined = deliverable?.uuid
      if (_deliverableId) {
        deliverableUuids.push({ uuid: _deliverableId })
      }
    })
  })

  const deliverablesRequest = await repository?.getDocuments({
    documents: deliverableUuids,
    accessToken: session.accessToken
  })

  if (!deliverablesRequest?.items || !deliverablesRequest.items.length) {
    return []
  }

  return deliverablesRequest?.items.reduce((all: Array<{ id: string | undefined, newsvalue: string | undefined }>, current) => {
    const currentNewsValue = current.document?.meta.find((block) => block.type === 'core/newsvalue')

    if (currentNewsValue) {
      all.push({ id: current?.document?.uuid, newsvalue: currentNewsValue?.value })
    }

    return all
  }, [])
}
