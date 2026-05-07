import * as Y from 'yjs'
import { describe, it, expect } from 'vitest'
import { isCompleteYjsNewsDoc, fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'

type RootKey = 'root' | 'meta' | 'links' | 'content'

function buildYDoc(present: Set<RootKey>): Y.Doc {
  const yDoc = new Y.Doc()
  const yEle = yDoc.getMap('ele')

  if (present.has('root')) {
    const root = new Y.Map<unknown>()
    root.set('uuid', '00000000-0000-0000-0000-000000000000')
    root.set('type', 'core/article')
    root.set('uri', 'core://article/test')
    root.set('url', 'https://example.test/article')
    root.set('title', 'Test')
    root.set('language', 'sv')
    yEle.set('root', root)
  }

  if (present.has('meta')) yEle.set('meta', new Y.Map<unknown>())
  if (present.has('links')) yEle.set('links', new Y.Map<unknown>())
  if (present.has('content')) yEle.set('content', new Y.XmlText())

  return yDoc
}

const ALL_KEYS: RootKey[] = ['root', 'meta', 'links', 'content']

describe('isCompleteYjsNewsDoc', () => {
  it('returns false for an empty Y.Doc', () => {
    expect(isCompleteYjsNewsDoc(new Y.Doc())).toBe(false)
  })

  it.each(ALL_KEYS)('returns false when ele.%s is missing', (missing) => {
    const present = new Set<RootKey>(ALL_KEYS.filter((k) => k !== missing))
    expect(isCompleteYjsNewsDoc(buildYDoc(present))).toBe(false)
  })

  it('returns true when all four root maps are present', () => {
    expect(isCompleteYjsNewsDoc(buildYDoc(new Set(ALL_KEYS)))).toBe(true)
  })
})

describe('fromYjsNewsDoc completeness guards', () => {
  it.each(ALL_KEYS)('throws a named error when ele.%s is missing', (missing) => {
    const present = new Set<RootKey>(ALL_KEYS.filter((k) => k !== missing))
    expect(() => fromYjsNewsDoc(buildYDoc(present)))
      .toThrow(`Cannot serialize incomplete document: ele.${missing} is missing`)
  })
})
