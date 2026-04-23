import { StatusSpecifications } from '@/defaults/workflowSpecification'
import type { Repository } from '@/shared/Repository'
import type { EleBlock } from '@/shared/types'

export const getAssignmentStatuses = async (assignments: EleBlock[], repository: Repository, accessToken: string) => {
  const acceptedStatuses = Object.keys(StatusSpecifications)

  const assignmentsId = (assignments || []).map((assignment) => {
    const type = assignment.meta['core/assignment-type'][0]?.value

    switch (type) {
      case 'picture':
        return { id: assignment.id, uuid: assignment.links['core/picture']?.[0]?.uuid }
      case 'video':
        return { id: assignment.id, uuid: assignment.links['core/video']?.[0]?.uuid }
      case 'text':
        return { id: assignment.id, uuid: assignment.links['core/article']?.[0]?.uuid }
      case 'graphic':
        return { id: assignment.id, uuid: assignment.links['core/graphic']?.[0]?.uuid }
      case 'editorial-info':
        return { id: assignment.id, uuid: assignment.links['core/editorial-info']?.[0]?.uuid }
      case 'flash':
        return { id: assignment.id, uuid: assignment.links['core/flash']?.[0]?.uuid }
      default:
        return
    }
  })

  const assignmentsUUIds = assignmentsId.map((item) => item?.uuid).filter((uuid) => uuid !== undefined)

  try {
    if (!repository || !accessToken) {
      throw new Error('Repository or access token is missing')
    }
    const result = await repository?.getStatuses({ uuids: assignmentsUUIds, statuses: acceptedStatuses, accessToken: accessToken })
    if (!result) {
      return undefined
    }
    return result.items.map((assignment) => {
      return { id: assignmentsId.find((item) => item?.uuid === assignment.uuid)?.id, uuid: assignment.uuid, workflowState: assignment.workflowState }
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
