import * as Y from 'yjs'
import { toYMap } from '../../../src-srv/utils/transformations/lib/toYMap'
import { type Block } from '@/protos/service'

/**
 * Create an empty planning assignment and add it to the planning Y.Doc.
 *
 * @param yDoc Y.Doc
 * @returns void
 */
export const createPlanningAssignment = (yDoc: Y.Doc): void => {
  const yEle = yDoc.getMap('ele')
  const meta = yEle.get('meta') as Y.Map<unknown>


  if (!meta.has('core/assignment')) {
    meta.set('core/assignment', new Y.Array())
  }

  const assignments = meta.get('core/assignment') as Y.Array<unknown>
  const assignment = new Y.Map()

  toYMap(
    getAssignmentTemplate(crypto.randomUUID(), 'text') as unknown as Record<string, unknown>,
    assignment
  )

  assignments.push([assignment])
}

/**
 * Create a template structure for an assigment
 *
 * TODO: Should be refactored into a more coherent group of functions with createPlanningDocument etc
 */
function getAssignmentTemplate(id: string, assignmentType: string): Block {
  return {
    // @ts-expect-error TODO: Remove this line when merged with snapshot-functionality branch
    __inProgress: true,
    id,
    uuid: '',
    uri: '',
    url: '',
    type: 'core/assignment',
    title: '',
    data: {
      end_date: '',
      full_day: 'true',
      start_date: '',
      end: '',
      start: '',
      public: 'true',
      publish: ''
    },
    rel: '',
    role: '',
    name: '',
    value: '',
    contentType: '',
    links: [
      {
        id: '',
        uuid: 'c37fdf3e-72ff-4e22-8b9f-1af0d60b0cd9',
        uri: '',
        url: '',
        type: 'core/author',
        title: '',
        data: {},
        rel: 'assignee',
        role: 'primary',
        name: 'Nomen Nescio/TT',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      },
      {
        id: '',
        uuid: 'f283c9a0-6a2e-4021-a009-087961dd032f',
        uri: '',
        url: '',
        type: 'core/article',
        title: '',
        data: {},
        rel: 'deliverable',
        role: '',
        name: '',
        value: '',
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ],
    content: [],
    meta: [
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
        type: 'core/assignment-type',
        title: '',
        data: {},
        rel: '',
        role: '',
        name: '',
        value: assignmentType,
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
        data: {
          text: 'foo'
        },
        rel: '',
        role: 'internal',
        name: '',
        value: assignmentType,
        contentType: '',
        links: [],
        content: [],
        meta: []
      }
    ]
  }
}
