import { Document, Block } from '@ttab/elephant-api/newsdoc'
import { currentDateInUTC } from '../../lib/datetime'

export interface PlanningDocumentPayload {
  eventId?: string
  eventTitle?: string
  newsvalue?: string
  createdDocumentIdRef?: React.MutableRefObject<string | undefined>
}

/**
 * Create a template structure for a planning document
 *
 * @returns Document
 */
export function planningDocumentTemplate(documentId: string, payload?: PlanningDocumentPayload): Document {
  const event = payload?.eventId
    ? [Block.create({
        uuid: payload?.eventId,
        type: 'core/event',
        title: payload?.eventTitle || 'Untitled',
        rel: 'event'
      })]
    : []

  const links = payload?.templateValues?.eventSection
    ? [
        Block.create({
          uuid: crypto.randomUUID(),
          type: 'core/section',
          rel: 'section',
          title: payload?.templateValues?.eventSection
        })
      ]
    : []

  if (payload?.templateValues?.story) {
    links.push(Block.create({
      uuid: crypto.randomUUID(),
      type: 'core/story',
      rel: 'story',
      title: payload?.templateValues?.story
    }))
  }

  return Document.create({
    uuid: documentId,
    type: 'core/planning-item',
    uri: `core://newscoverage/${documentId}`,
    language: 'sv-se',
    meta: [
      Block.create({
        type: 'core/planning-item',
        data: {
          public: 'true',
          end_date: currentDateInUTC(),
          tentative: 'false',
          start_date: currentDateInUTC()
        }
      }),
      Block.create({
        type: 'core/newsvalue',
        value: payload?.templateValues?.newsvalue || undefined
      }),
      Block.create({
        type: 'tt/slugline'
      }),
      Block.create({
        type: 'core/description',
        data: { text: '' },
        role: 'public'
      }),
      Block.create({
        type: 'core/description',
        data: { text: '' },
        role: 'internal'
      })
    ],
    links,
    ...event
  })
}
