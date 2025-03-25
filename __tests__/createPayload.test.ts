import * as Y from 'yjs'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { planning } from './data/planning-newsdoc'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'

describe('createPayload', () => {
  // Append planning slugline, its how normal planning documents look,
  // however it clashes with transform-document.test.ts tests
  planning.document?.meta.push({
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
    value: 'lands-',
    contenttype: '',
    sensitivity: '',
    links: [],
    content: [],
    meta: []
  })

  let planningDocument: Y.Doc
  beforeEach(() => {
    planningDocument = new Y.Doc()
    toYjsNewsDoc(
      toGroupedNewsDoc(planning),
      planningDocument
    )
  })

  it('should return a newsvalue from planning', () => {
    const result = createPayload(planningDocument)

    expect(result?.meta?.['core/newsvalue']).toHaveLength(1)
    expect(result?.meta?.['core/newsvalue']?.[0].value).toBe('4')
  })

  it('should return a slugline from assignment', () => {
    const result = createPayload(planningDocument, 0)

    expect(result?.meta?.['tt/slugline']).toHaveLength(1)
    expect(result?.meta?.['tt/slugline']?.[0].value).toBe('lands-tomasson')
  })

  it('should return a slugline planning', () => {
    const result = createPayload(planningDocument)

    expect(result?.meta?.['tt/slugline']).toHaveLength(1)
    expect(result?.meta?.['tt/slugline']?.[0].value).toBe('lands-')
  })

  it('should return a section', () => {
    const result = createPayload(planningDocument)

    expect(result?.links?.['core/section']).toHaveLength(1)
    expect(result?.links?.['core/section']?.[0].title).toBe('Sport')
  })
})
