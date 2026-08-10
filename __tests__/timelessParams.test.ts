import { describe, it, expect } from 'vitest'
import { timelessParams } from '@/hooks/index/useDocuments/queries/views/timeless'

const readMust = (params: ReturnType<typeof timelessParams>) => {
  const query = params.query
  if (!query || query.conditions.oneofKind !== 'bool') {
    throw new Error('expected bool query')
  }
  return query.conditions.bool.must
}

const readTerms = (params: ReturnType<typeof timelessParams>) => {
  const statusClause = readMust(params).find((c) =>
    c.conditions.oneofKind === 'terms'
    && c.conditions.terms.field === 'workflow_state'
  )
  if (!statusClause || statusClause.conditions.oneofKind !== 'terms') {
    throw new Error('expected terms clause on workflow_state')
  }
  return statusClause.conditions.terms.values
}

const findMultiMatch = (params: ReturnType<typeof timelessParams>) => {
  const clause = readMust(params).find((c) => c.conditions.oneofKind === 'multiMatch')
  if (!clause) {
    return undefined
  }
  if (clause.conditions.oneofKind !== 'multiMatch') {
    throw new Error('expected multiMatch clause')
  }
  return clause.conditions.multiMatch
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

  describe('free text search', () => {
    it('sends no text clause when no term is supplied', () => {
      expect(findMultiMatch(timelessParams(undefined))).toBeUndefined()
      expect(readMust(timelessParams(undefined))).toHaveLength(1)
    })

    it('sends no text clause for an empty term', () => {
      expect(findMultiMatch(timelessParams(undefined, ''))).toBeUndefined()
    })

    // `text` is the only body text field in the core/article#timeless mapping,
    // and it is searchable but never returned on a hit - so this clause is the
    // only way the inline text can be searched at all.
    it('matches the term against the headline and the inline text', () => {
      const multiMatch = findMultiMatch(timelessParams(undefined, 'kryptovaluta'))

      expect(multiMatch?.fields).toEqual(['document.title', 'text'])
      expect(multiMatch?.query).toBe('kryptovaluta')
      expect(multiMatch?.type).toBe('phrase_prefix')
    })

    it('keeps the status filter alongside the term so search stays scoped', () => {
      const params = timelessParams(['used'], 'kryptovaluta')

      expect(readTerms(params)).toEqual(['used'])
      expect(findMultiMatch(params)?.query).toBe('kryptovaluta')
    })

    it('leaves documentType and sort untouched when searching', () => {
      const params = timelessParams(undefined, 'kryptovaluta')

      expect(params.documentType).toBe('core/article#timeless')
      expect(params.sort.map((s) => s.field)).toEqual([
        'modified',
        'document.title.sort'
      ])
    })
  })
})
