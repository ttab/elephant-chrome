import { describe, it, expect } from 'vitest'
import { timelessParams } from '@/hooks/index/useDocuments/queries/views/timeless'

const readTerms = (params: ReturnType<typeof timelessParams>) => {
  const query = params.query
  if (!query || query.conditions.oneofKind !== 'bool') {
    throw new Error('expected bool query')
  }
  const must = query.conditions.bool.must
  const statusClause = must.find((c) =>
    c.conditions.oneofKind === 'terms'
    && c.conditions.terms.field === 'workflow_state'
  )
  if (!statusClause || statusClause.conditions.oneofKind !== 'terms') {
    throw new Error('expected terms clause on workflow_state')
  }
  return statusClause.conditions.terms.values
}

describe('timelessParams', () => {
  it('defaults to draft + done when no status is supplied', () => {
    const params = timelessParams(undefined)
    expect(readTerms(params)).toEqual(['draft', 'done'])
  })

  it('defaults to draft + done when status is an empty array', () => {
    const params = timelessParams([])
    expect(readTerms(params)).toEqual(['draft', 'done'])
  })

  it('uses the supplied status when non-empty', () => {
    const params = timelessParams(['used'])
    expect(readTerms(params)).toEqual(['used'])
  })

  it('uses the supplied status when it contains multiple values', () => {
    const params = timelessParams(['draft', 'done', 'used'])
    expect(readTerms(params)).toEqual(['draft', 'done', 'used'])
  })

  it('keeps documentType and sort intact', () => {
    const params = timelessParams(undefined)
    expect(params.documentType).toBe('core/article#timeless')
    expect(params.sort.map((s) => s.field)).toEqual([
      'modified',
      'document.title.sort'
    ])
  })
})
