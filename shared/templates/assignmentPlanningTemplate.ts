import type { Wire } from '../tmp/wire.js'
import { Block } from '@ttab/elephant-api/newsdoc'

// TODO: Type defined here, but not usable in this file yet.
// import type { IDBAuthor } from 'src/datastore/types'
interface IDBAuthor {
  id: string
  name: string
  firstName: string
  lastName: string
  initials: string
  email: string
  sub: string
}

/**
 * Create a template structure for an assigment
 * @returns Block
 */
export function assignmentPlanningTemplate({
  assignmentType,
  planningDate,
  slugLine,
  title,
  wire,
  assignmentData,
  assignee
}: {
  assignmentType: string
  planningDate: string
  slugLine?: string
  title?: string
  wire?: Wire
  assignmentData?: Block['data']
  assignee: IDBAuthor | null | undefined
}): Block {
  const startDateAndTime = (type: string): string => {
    const isTextFlashOrEditorialInfo = ['text', 'flash', 'editorial-info'].includes(type)

    if (isTextFlashOrEditorialInfo) {
      const currentTime = new Date().toISOString().split('T')[1]
      return new Date(`${planningDate}T${currentTime}`).toISOString()
    } else {
      return new Date(`${planningDate}T00:00:00`).toISOString()
    }
  }

  const wireContentSourceDocument: Block[] = [
    wire
      ? Block.create({
        type: 'tt/wire',
        uuid: wire.id,
        title: wire.fields['document.title'].values[0],
        rel: 'source-document',
        data: {
          version: wire.fields['current_version'].values[0]
        }
      })
      : undefined
  ].filter((x): x is Block => x !== undefined)

  const author: Block[] = [
    assignee
      ? Block.create({
        uuid: assignee.id,
        type: 'core/author',
        title: assignee.name,
        rel: 'assignee',
        role: 'primary'
      })
      : undefined
  ].filter((x): x is Block => x !== undefined)

  // Plain dates, are getting set with UI
  return Block.create({
    id: crypto.randomUUID(),
    type: 'core/assignment',
    title: title || undefined,
    // Use provided assignmentData or default values
    data: assignmentData || {
      full_day: 'false',
      end_date: planningDate,
      start_date: planningDate,
      start: startDateAndTime(assignmentType),
      public: assignmentType === 'flash'
        ? 'false'
        : 'true'
    },
    meta: [
      {
        type: 'tt/slugline',
        value: slugLine || ''
      },
      {
        type: 'core/description',
        data: {
          text: ''
        },
        role: 'internal'
      },
      {
        type: 'core/assignment-type',
        value: assignmentType
      }
    ],
    links: [
      ...wireContentSourceDocument,
      ...author
    ]
  })
}

