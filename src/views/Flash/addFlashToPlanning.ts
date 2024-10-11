import { convertToISOStringInTimeZone } from '@/lib/datetime'
import { isYMap } from '@/lib/isType'
import { getValueByYPath, toSlateYXmlText } from '@/lib/yUtils'
import { YBlock } from '@/shared/YBlock'
import { toYMap } from '../../../src-srv/utils/transformations/lib/toYMap'
import * as Y from 'yjs'

export function addFlashToPlanning(flashDoc: Y.Doc, planningDoc: Y.Doc, assignmentId: string, timeZone: string): string {
  const flash = flashDoc.getMap('ele')
  const [flashId] = getValueByYPath<string>(flash, 'root.uuid')
  const [flashTitle] = getValueByYPath<string>(flash, 'root.title')
  const [flashSections] = getValueByYPath<Y.Array<unknown>>(flash, 'links.core/section', true)

  const planning = planningDoc.getMap('ele')
  const [planningTitle, planningRoot] = getValueByYPath<string>(planning, 'root.title')


  if (!flashId || !flashTitle || (!planningTitle && !flashSections?.length)) {
    throw new Error('Id, title and section is missing on new flash')
  }

  if (!isYMap(planningRoot)) {
    throw new Error('Planning document is faulty, no root Y.Map exists')
  }

  // If no planning title exists this is a new planning
  if (!planningTitle) {
    (planningRoot).set('title', toSlateYXmlText(flashTitle))

    // Transfer section to planning
    const [planningLinks] = getValueByYPath<Y.Map<Y.Array<unknown>>>(planning, 'links', true)
    // @ts-expect-error Typescript don't understand safeguard !flashSections?.length
    planningLinks?.set('core/section', flashSections.clone())
  }

  // Create assignment (using given assignment id)
  const dt = new Date()
  const zuluISODate = `${new Date().toISOString().split('.')[0]}Z` // Remove ms, add Z back again
  const localISODateTime = convertToISOStringInTimeZone(dt, timeZone).slice(0, 10)

  const eleAssignment = YBlock.create({
    id: assignmentId,
    type: 'core/assignment',
    title: flashTitle,
    data: {
      full_day: 'false',
      start_date: localISODateTime,
      end_date: localISODateTime,
      start: zuluISODate,
      end: zuluISODate,
      public: 'true',
      publish: zuluISODate
    },
    meta: [
      {
        type: 'core/assignment-type',
        value: 'flash'
      },
      {
        type: 'core/description',
        data: {
          text: ''
        }
      }
    ],
    links: [{
      type: 'core/flash',
      rel: 'deliverable',
      uuid: flashId
    }]
  })

  const yAssignment = toYMap(eleAssignment[0] as unknown as Record<string, unknown>)

  const [yAssignments] = getValueByYPath(planning, 'meta.core/assignment', true)
  if (yAssignments) {
    (yAssignments as Y.Array<Y.Map<unknown>>).push([yAssignment])
  } else {
    const yMeta = planning.get('meta') as Y.Map<unknown>
    const newYAssignments = new Y.Array()

    newYAssignments.push([yAssignment])
    yMeta.set('core/assignment', newYAssignments)
  }

  // Add assignees from flash authors
  const [links] = getValueByYPath<Y.Map<unknown>>(yAssignment, 'links', true)
  const [flashAuthors] = getValueByYPath<Y.Array<Y.Map<unknown>>>(flash, 'links.core/author', true)

  if (links && flashAuthors) {
    const assignees = new Y.Array()
    links.set('core/author', assignees)

    flashAuthors.forEach(author => {
      const eleAssignee = YBlock.create({
        type: 'core/author',
        rel: 'assignee',
        role: 'primary',
        uuid: author.get('uuid') as string,
        name: (author.get('title') as Y.XmlText).toJSON() // FIXME: Use title for both when repo schema is fixed
      })

      const assignee = toYMap(eleAssignee[0] as unknown as Record<string, unknown>)

      assignees.push([assignee])
    })
  }

  return getValueByYPath<string>(planning, 'root.uuid')?.[0] || ''
}
