import { buildAdvancedQuery } from '@/components/AdvancedSearch/lib/buildQuery'
import { createDefaultState } from '@/components/AdvancedSearch/lib/defaultState'
import { articlesFields, wiresFields } from '@/components/AdvancedSearch/configs'
import type { AdvancedSearchState, FieldPath, SearchFieldConfig } from '@/components/AdvancedSearch/types'

function querySyntaxState(raw: string, fields: SearchFieldConfig[] = articlesFields): AdvancedSearchState {
  return {
    mode: 'querySyntax',
    name: '',
    structured: createDefaultState(fields).structured,
    querySyntax: { raw }
  }
}

describe('buildAdvancedQuery', () => {
  describe('structured mode', () => {
    it('returns undefined for empty query', () => {
      const state = createDefaultState(articlesFields)
      expect(buildAdvancedQuery(state, articlesFields)).toBeUndefined()
    })

    it('returns undefined for whitespace-only query', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = '   '
      expect(buildAdvancedQuery(state, articlesFields)).toBeUndefined()
    })

    it('builds a multiMatch query with default fields', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'ukraine crisis'

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result).toBeDefined()
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        const mm = result.conditions.multiMatch
        expect(mm.query).toBe('ukraine crisis')
        expect(mm.type).toBe('best_fields')
        expect(mm.fields).toEqual([
          'document.title',
          'document.content.core_text.data.text',
          'document.meta.tt_slugline.value',
          'document.rel.subject.title'
        ])
        expect(mm.booleanAnd).toBe(false)
        expect(mm.fuzziness).toBeUndefined()
      }
    })

    it('uses selected fields when provided', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.selectedFields = ['document.title' as FieldPath]

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.fields).toEqual(['document.title'])
      }
    })

    it('falls back to default fields when selectedFields is empty', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.selectedFields = []

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.fields).toEqual(
          articlesFields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)
        )
      }
    })

    it('sets phrase match type', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'exact phrase'
      state.structured.matchType = 'phrase'

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.type).toBe('phrase')
      }
    })

    it('sets booleanAnd when enabled', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'all these terms'
      state.structured.booleanAnd = true

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.booleanAnd).toBe(true)
      }
    })

    it('adds fuzziness when enabled', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'fuzzy search'
      state.structured.fuzzy = true
      state.structured.fuzzyEdits = 1

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.fuzziness).toBeDefined()
        expect(result.conditions.multiMatch.fuzziness?.edits).toBe(BigInt(1))
      }
    })

    it('defaults to fuzzy auto mode', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'fuzzy search'
      state.structured.fuzzy = true

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.fuzziness?.auto).toBeDefined()
        expect(result.conditions.multiMatch.fuzziness?.auto?.low).toBe(BigInt(0))
        expect(result.conditions.multiMatch.fuzziness?.auto?.high).toBe(BigInt(0))
      }
    })

    it('uses edits when explicitly set to number', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'fuzzy search'
      state.structured.fuzzy = true
      state.structured.fuzzyEdits = 2

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.fuzziness?.edits).toBe(BigInt(2))
        expect(result.conditions.multiMatch.fuzziness?.auto).toBeUndefined()
      }
    })
  })

  describe('query syntax mode', () => {
    it('returns undefined for empty raw query', () => {
      expect(buildAdvancedQuery(querySyntaxState(''), articlesFields)).toBeUndefined()
    })

    it('returns undefined for whitespace-only raw query', () => {
      expect(buildAdvancedQuery(querySyntaxState('   '), articlesFields)).toBeUndefined()
    })

    it('builds a queryString query', () => {
      const result = buildAdvancedQuery(querySyntaxState('ukraine AND crisis'), articlesFields)
      expect(result).toBeDefined()
      expect(result?.conditions.oneofKind).toBe('queryString')

      if (result?.conditions.oneofKind === 'queryString') {
        expect(result.conditions.queryString).toBe('ukraine AND crisis')
      }
    })

    it('replaces field aliases with OpenSearch paths', () => {
      const result = buildAdvancedQuery(querySyntaxState('title:"ukraine" AND content:crisis'), articlesFields)
      expect(result?.conditions.oneofKind).toBe('queryString')

      if (result?.conditions.oneofKind === 'queryString') {
        expect(result.conditions.queryString).toBe(
          'document.title:"ukraine" AND document.content.core_text.data.text:crisis'
        )
      }
    })

    it('replaces multiple occurrences of the same alias', () => {
      const result = buildAdvancedQuery(querySyntaxState('title:foo OR title:bar'), articlesFields)
      expect(result?.conditions.oneofKind).toBe('queryString')

      if (result?.conditions.oneofKind === 'queryString') {
        expect(result.conditions.queryString).toBe(
          'document.title:foo OR document.title:bar'
        )
      }
    })

    it('uses wires field aliases correctly', () => {
      const result = buildAdvancedQuery(querySyntaxState('content:flash AND table:data', wiresFields), wiresFields)
      expect(result?.conditions.oneofKind).toBe('queryString')

      if (result?.conditions.oneofKind === 'queryString') {
        expect(result.conditions.queryString).toBe(
          'document.content.core_text.data.text:flash AND document.content.core_table.data.tbody:data'
        )
      }
    })

    it('does not replace text that looks like a field but is not an alias', () => {
      const result = buildAdvancedQuery(querySyntaxState('unknown:value AND title:test'), articlesFields)
      expect(result?.conditions.oneofKind).toBe('queryString')

      if (result?.conditions.oneofKind === 'queryString') {
        expect(result.conditions.queryString).toBe(
          'unknown:value AND document.title:test'
        )
      }
    })

    it('trims whitespace from raw query', () => {
      const result = buildAdvancedQuery(querySyntaxState('  ukraine  '), articlesFields)
      expect(result?.conditions.oneofKind).toBe('queryString')

      if (result?.conditions.oneofKind === 'queryString') {
        expect(result.conditions.queryString).toBe('ukraine')
      }
    })
  })

  describe('date range', () => {
    const dateField = 'heads.usable.created'

    it('returns undefined when only date range is set without dateField', () => {
      const state = createDefaultState(articlesFields)
      state.structured.dateRange = { from: '2026-01-01', to: '2026-03-01' }
      expect(buildAdvancedQuery(state, articlesFields)).toBeUndefined()
    })

    it('builds a range query for date-only search', () => {
      const state = createDefaultState(articlesFields)
      state.structured.dateRange = { from: '2026-01-01', to: '2026-03-01' }

      const result = buildAdvancedQuery(state, articlesFields, dateField)
      expect(result?.conditions.oneofKind).toBe('range')

      if (result?.conditions.oneofKind === 'range') {
        expect(result.conditions.range.field).toBe(dateField)
        expect(result.conditions.range.gte).toBe('2026-01-01')
        // Uses lt with next day to include entire end date
        expect(result.conditions.range.lt).toBe('2026-03-02')
      }
    })

    it('builds range with from-only', () => {
      const state = createDefaultState(articlesFields)
      state.structured.dateRange = { from: '2026-01-01', to: '' }

      const result = buildAdvancedQuery(state, articlesFields, dateField)
      expect(result?.conditions.oneofKind).toBe('range')

      if (result?.conditions.oneofKind === 'range') {
        expect(result.conditions.range.gte).toBe('2026-01-01')
        expect(result.conditions.range.lt).toBe('')
      }
    })

    it('builds range with to-only', () => {
      const state = createDefaultState(articlesFields)
      state.structured.dateRange = { from: '', to: '2026-03-01' }

      const result = buildAdvancedQuery(state, articlesFields, dateField)
      expect(result?.conditions.oneofKind).toBe('range')

      if (result?.conditions.oneofKind === 'range') {
        expect(result.conditions.range.gte).toBe('')
        // Uses lt with next day to include entire end date
        expect(result.conditions.range.lt).toBe('2026-03-02')
      }
    })

    it('wraps text + date in bool query', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'ukraine'
      state.structured.dateRange = { from: '2026-01-01', to: '' }

      const result = buildAdvancedQuery(state, articlesFields, dateField)
      expect(result?.conditions.oneofKind).toBe('bool')

      if (result?.conditions.oneofKind === 'bool') {
        expect(result.conditions.bool.must).toHaveLength(2)
        expect(result.conditions.bool.must[0].conditions.oneofKind).toBe('multiMatch')
        expect(result.conditions.bool.must[1].conditions.oneofKind).toBe('range')
      }
    })
  })

  describe('boost', () => {
    it('sets boost on multiMatch when > 1', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.boost = 3

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.boost).toBe(3)
      }
    })

    it('does not set boost when 1', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.boost = 1

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.boost).toBe(0)
      }
    })
  })

  describe('fuzzy prefix length', () => {
    it('sets prefixLength when fuzzy and prefixLength > 0', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.fuzzy = true
      state.structured.fuzzyPrefixLength = 2

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.prefixLength).toBe(BigInt(2))
      }
    })

    it('does not set prefixLength when 0', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.fuzzy = true
      state.structured.fuzzyPrefixLength = 0

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.prefixLength).toBe(BigInt(0))
      }
    })
  })

  describe('field existence', () => {
    it('builds exists condition', () => {
      const state = createDefaultState(articlesFields)
      state.structured.fieldExists = [{ field: 'document.title' as FieldPath, exists: true }]

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('exists')

      if (result?.conditions.oneofKind === 'exists') {
        expect(result.conditions.exists).toBe('document.title')
      }
    })

    it('builds mustNot exists for missing', () => {
      const state = createDefaultState(articlesFields)
      state.structured.fieldExists = [{ field: 'document.title' as FieldPath, exists: false }]

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('bool')

      if (result?.conditions.oneofKind === 'bool') {
        expect(result.conditions.bool.mustNot).toHaveLength(1)
        expect(result.conditions.bool.mustNot[0].conditions.oneofKind).toBe('exists')
      }
    })

    it('combines multiple field exists in bool', () => {
      const state = createDefaultState(articlesFields)
      state.structured.fieldExists = [
        { field: 'document.title' as FieldPath, exists: true },
        { field: 'document.content' as FieldPath, exists: false }
      ]

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('bool')

      if (result?.conditions.oneofKind === 'bool') {
        expect(result.conditions.bool.must).toHaveLength(2)
      }
    })
  })

  describe('combined conditions', () => {
    it('wraps text + date + field exists in bool must', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'ukraine'
      state.structured.dateRange = { from: '2026-01-01', to: '' }
      state.structured.fieldExists = [{ field: 'document.title' as FieldPath, exists: true }]

      const result = buildAdvancedQuery(state, articlesFields, 'heads.usable.created')
      expect(result?.conditions.oneofKind).toBe('bool')

      if (result?.conditions.oneofKind === 'bool') {
        expect(result.conditions.bool.must).toHaveLength(3)
      }
    })
  })
})
