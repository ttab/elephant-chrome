import { type SearchIndexResponse } from '@/lib/index'
import {
  type LoadedDocumentItem,
  type AssignmentMeta,
  type MetaValueType,
  type TypeValue,
  type AssignmentMetaExtended,
  type LinkMeta
} from '../types'

export const transformAssignments = (result: SearchIndexResponse<LoadedDocumentItem>): (AssignmentMetaExtended[]) => {
  const assignments: (AssignmentMetaExtended[]) = []

  result.hits.forEach((hit: LoadedDocumentItem) => {
    const { title: planningTitle, meta, links = [] } = hit.document
    const assignmentMetas = meta?.filter((assignmentMeta: MetaValueType) => assignmentMeta.type === 'core/assignment') as AssignmentMetaExtended[]
    const section = links.find((l) => l.type === 'core/section') as LinkMeta
    const newsvalue: (TypeValue | undefined) = meta?.find((assignmentMeta) => assignmentMeta.type === 'core/newsvalue') as TypeValue
    assignmentMetas?.forEach((assignmentMeta: AssignmentMeta) => {
      assignments.push({
        ...assignmentMeta,
        planningTitle,
        newsvalue: newsvalue?.value,
        _id: hit.id,
        section: section?.title
      })
    })
  })

  return assignments
}
