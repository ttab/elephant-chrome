import {
  type Response,
  type Item,
  type MetaTwo,
  type MetaValueType,
  type TypeValue
} from '../types'

import { convertToISOStringInUTC } from '@/lib/datetime'

export const getAllAssignments = (result: Response<Item>): (MetaTwo[] | undefined) => {
  const assignments: (Array<MetaTwo & { planningTitle: string, newsvalue: string }>) = []

  result.hits.hits.forEach((hit: Item) => {
    const { title: planningTitle, meta } = hit.document
    const assignmentMetas = meta?.filter((assignmentMeta: MetaValueType) => assignmentMeta.type === 'core/assignment') as MetaTwo[]
    const newsvalue: (TypeValue | undefined) = meta?.find(assignmentMeta => assignmentMeta.type === 'core/newsvalue') as TypeValue
    assignmentMetas?.forEach((assignmentMeta: MetaTwo) => {
      console.log('🍄 ~ assignmentMetas?.forEach ~ assignmentMeta ✅ ', assignmentMeta)
      assignments.push({
        ...assignmentMeta,
        planningTitle,
        newsvalue: newsvalue?.value
      })
    })
  })

  return assignments
}

const getMeta = (a: Item): (MetaValueType[] | undefined) => {
  if (a.document.meta) {
    return a?.document?.meta
  }
  return []
}

export const getAssignmentTitles = (a: Item): (string[] | undefined) => {
  const assignments = getAssignments(a)
  return assignments?.map(a => a.title)
}

export const getAssignments = (a: Item): (MetaTwo[] | undefined) => {
  const data = getMeta(a)?.filter(m => m.type === 'core/assignment')
  if (data) {
    return data as MetaTwo[]
  }
  return undefined
}

// export const getAssignmentType = (a: Item): (string | undefined) => {
//   const typeFormat = {
//     text: 'Text',
//     picture: 'Bild'
//   }
//   const assignments = getAssignments(a)
//   console.log('🍄 ~ getAssignmentType ~ assignments ✅ ', assignments)
//   const assignmentType = assignments?.meta?.filter(m => m.type === 'core/assignment-type')
//   const typeValue: 'text' | 'picture' = (assignmentType?.value as 'text' | 'picture') || ''
//   if (assignmentType && 'value' in assignmentType) {
//     return typeFormat[typeValue]
//   }
//   return undefined
// }

export const getTime = (a: Item): (string | undefined) => {
  const assignments = getAssignments(a)
  if (assignments?.[0].data?.start) {
    return convertToISOStringInUTC(new Date(assignments?.[0].data?.start))
  }
}
