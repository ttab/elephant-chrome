import {
  type AssignmentResponse,
  type LoadedDocumentItem,
  type AssignmentMeta,
  type MetaValueType,
  type TypeValue
} from '../types'

export const transformAssignments = (result: AssignmentResponse<LoadedDocumentItem>): (AssignmentMeta[]) => {
  const assignments: (Array<AssignmentMeta & { planningTitle: string, newsvalue: string }>) = []

  result.hits.hits.forEach((hit: LoadedDocumentItem) => {
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

  return assignments.sort((a, b) => {
    if (a.newsvalue > b.newsvalue) return -1
    if (a.newsvalue < b.newsvalue) return 1
    if (a.data.start < b.data.start) return -1
    if (a.data.start > b.data.start) return 1
    return 0
  })
}
