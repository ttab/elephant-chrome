import * as Y from 'yjs'
import { createPayload } from '@/shared/templates/lib/createPayload'
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

  it('filters out an empty-value slugline block from the assignment', () => {
    const docWithEmptyAssignmentSlugline = new Y.Doc()
    const fixture = structuredClone(planning)
    const assignment = fixture.document?.meta.find((b) => b.type === 'core/assignment')
    const sluglineBlock = assignment?.meta.find((b) => b.type === 'tt/slugline')
    if (sluglineBlock) {
      sluglineBlock.value = '   '
    }
    toYjsNewsDoc(toGroupedNewsDoc(fixture), docWithEmptyAssignmentSlugline)

    const result = createPayload(docWithEmptyAssignmentSlugline, 0)

    expect(result?.meta?.['tt/slugline']).toEqual([])
  })

  it('filters out an empty-value slugline block from the planning root', () => {
    const docWithEmptyPlanningSlugline = new Y.Doc()
    const fixture = structuredClone(planning)
    const sluglineBlock = fixture.document?.meta.find((b) => b.type === 'tt/slugline')
    if (sluglineBlock) {
      sluglineBlock.value = ''
    }
    toYjsNewsDoc(toGroupedNewsDoc(fixture), docWithEmptyPlanningSlugline)

    const result = createPayload(docWithEmptyPlanningSlugline)

    expect(result?.meta?.['tt/slugline']).toEqual([])
  })
})
