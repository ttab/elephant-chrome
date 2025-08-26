import { StatusSpecifications } from '@/defaults/workflowSpecification'
import type { Repository } from '@/shared/Repository'
import type { HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'

export const getDeliverableStatuses = async ({ result, repository, session }: { result: HitV1[], repository: Repository | undefined, session: Session }) => {
  if (!result || !repository || !session) {
    return { items: [] }
  }

  const knownStatuses = Object.keys(StatusSpecifications)
  const uuids: string[] = result.reduce((all: string[], current) => {
    const allowedTypes = ['text', 'flash', 'editorial-info']

    const ass = current.document?.meta.filter((m) => {
      const assignmentType = m.meta.find((m) => m.type === 'core/assignment-type')?.value

      if (assignmentType) {
        return m.type === 'core/assignment' && allowedTypes.includes(assignmentType)
      }

      return false
    })

    const deliverables = ass?.map((a) => a.links?.filter((link) => link?.rel === 'deliverable').map((deliverable) => deliverable.uuid)).flat()
    if (deliverables && deliverables.length > 0) {
      all.push(...deliverables)
    }
    return all
  }, []).flat()

  const statuses = await repository?.getStatuses({
    uuids,
    statuses: knownStatuses,
    accessToken: session.accessToken
  })
  return statuses
}
