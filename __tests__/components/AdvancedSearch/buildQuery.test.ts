import { buildAdvancedQuery } from '@/components/AdvancedSearch/lib/buildQuery'
import { createDefaultState } from '@/components/AdvancedSearch/lib/defaultState'
import { articlesFields, wiresFields } from '@/components/AdvancedSearch/configs'
import type { AdvancedSearchState, FieldPath, SearchFieldConfig } from '@/components/AdvancedSearch/types'

function querySyntaxState(raw: string, fields: SearchFieldConfig[] = articlesFields): AdvancedSearchState {
  return {
    mode: 'querySyntax',
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

    it('defaults fuzzy edits to 2', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'fuzzy search'
      state.structured.fuzzy = true

      const result = buildAdvancedQuery(state, articlesFields)
      expect(result?.conditions.oneofKind).toBe('multiMatch')

      if (result?.conditions.oneofKind === 'multiMatch') {
        expect(result.conditions.multiMatch.fuzziness?.edits).toBe(BigInt(2))
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
})
