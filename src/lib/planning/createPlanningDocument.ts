import * as Y from 'yjs'
import { type Document } from '@/protos/service'
import { newsDocToYDoc } from '../../../src-srv/utils/transformations/yjs/yDoc'

/**
 * Create empty planning document and convert it to Y.Doc as appropriate.
 * Returns array with uuid and Y.Doc.
 *
 * @returns [string, Y.Doc]
 */
export const createPlanningDocument = (locale: string, timeZone: string): [string, Y.Doc] => {
  const documentId = crypto.randomUUID()
  const yDoc = new Y.Doc()

  newsDocToYDoc(yDoc, {
    version: 0n,
    document: getPlanningTemplate(documentId, locale, timeZone)
  })

  const yRoot = yDoc.getMap('ele').get('root') as Y.Map<unknown>
  yRoot.set('__inProgress', true)

  return [documentId, yDoc]
}

/**
 * Create a template structure for a aplanning
 *
 * TODO: Should be refactored into a more coherent group of functions with createPlanningAssignment etc
 */
function getPlanningTemplate(id: string, locale: string, timeZone: string): Document {
  const date = new Date()
  const formattedDate = new Intl.DateTimeFormat(locale,
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone
    }).format(date)


  return {
    uuid: id,
    type: 'core/planning-item',
    uri: `core://newscoverage/${id}`,
    url: '',
    title: '',
    language: 'sv-se',
    content: [],
    meta: [
      {
        id: 'abc123',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/planning-item',
        title: '',
        data: {
          public: 'true',
          end_date: formattedDate,
          tentative: 'false',
          start_date: formattedDate
        },
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/newsvalue',
        title: '',
        data: {},
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'tt/slugline',
        title: '',
        data: {},
        rel: '',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/description',
        title: '',
        data: { text: '' },
        rel: '',
        role: 'public',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: '',
        uri: '',
        url: '',
        type: 'core/description',
        title: '',
        data: { text: '' },
        rel: '',
        role: 'internal',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    links: []
  }
}
