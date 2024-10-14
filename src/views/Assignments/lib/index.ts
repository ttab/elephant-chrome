import {
  type Response,
  type Item,
  type AssignmentMeta,
  type MetaValueType,
  type TypeValue
} from '../types'

export const getAllAssignments = (result: Response<Item>): (AssignmentMeta[]) => {
  const assignments: (Array<AssignmentMeta & { planningTitle: string, newsvalue: string }>) = []

  result.hits.hits.forEach((hit: Item) => {
    const { title: planningTitle, meta } = hit.document
    const assignmentMetas = meta?.filter((assignmentMeta: MetaValueType) => assignmentMeta.type === 'core/assignment') as AssignmentMeta[]
    const newsvalue: (TypeValue | undefined) = meta?.find(assignmentMeta => assignmentMeta.type === 'core/newsvalue') as TypeValue

    assignmentMetas?.forEach((assignmentMeta: AssignmentMeta) => {
      assignments.push({
        ...assignmentMeta,
        planningTitle,
        newsvalue: newsvalue?.value

      })
    })
  })

  return assignments
}
