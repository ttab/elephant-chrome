import * as Y from 'yjs'
import { type Document } from '@/protos/service'
import { newsDocToYDoc } from '../../../src-srv/utils/transformations/yjs/yDoc'
import { currentDateInUTC } from '../datetime'

/**
 * Create empty planning document and convert it to Y.Doc as appropriate.
 * Returns array with uuid and Y.Doc.
 *
 * @returns [string, Y.Doc]
 */
export const createPlanningDocument = (): [string, Y.Doc] => {
  const documentId = crypto.randomUUID()
  const yDoc = new Y.Doc()

  newsDocToYDoc(yDoc, {
    version: 0n,
    document: getPlanningTemplate(documentId)
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
function getPlanningTemplate(id: string): Document {
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
          end_date: currentDateInUTC(),
          tentative: 'false',
          start_date: currentDateInUTC()
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
