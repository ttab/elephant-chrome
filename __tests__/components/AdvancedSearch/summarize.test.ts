import { summarizeState } from '@/components/AdvancedSearch/lib/summarize'
import { createDefaultState } from '@/components/AdvancedSearch/lib/defaultState'
import { articlesFields } from '@/components/AdvancedSearch/configs'
import type { AdvancedSearchState, FieldPath, SearchFieldConfig } from '@/components/AdvancedSearch/types'

function querySyntaxState(raw: string, fields: SearchFieldConfig[] = articlesFields): AdvancedSearchState {
  return {
    mode: 'querySyntax',
    structured: createDefaultState(fields).structured,
    querySyntax: { raw }
  }
}

const t = (key: string, options?: Record<string, string | number>): string => {
  const map: Record<string, string> = {
    'advancedSearch.exactPhrase': 'Exact phrase',
    'advancedSearch.requireAllTerms': 'Require all terms (AND)',
    'advancedSearch.fields.title': 'Title',
    'advancedSearch.fields.content': 'Content',
    'advancedSearch.fields.slugline': 'Slugline',
    'advancedSearch.fields.subject': 'Subject',
    'advancedSearch.fields.table': 'Table'
  }
  if (key === 'advancedSearch.badge.boost') {
    return `Boost: ${options?.boost}x`
  }
  if (key === 'advancedSearch.badge.fuzzy') {
    return `Fuzzy (~${options?.edits})`
  }
  if (key === 'advancedSearch.badge.fields') {
    return `Fields: ${options?.fields}`
  }
  return map[key] || key
}

describe('summarizeState', () => {
  describe('querySyntax mode', () => {
    it('returns empty badges for empty raw query', () => {
      expect(summarizeState(querySyntaxState(''), articlesFields, t)).toEqual([])
    })

    it('returns raw query as badge', () => {
      const badges = summarizeState(querySyntaxState('title:ukraine'), articlesFields, t)
      expect(badges).toHaveLength(1)
      expect(badges[0].key).toBe('queryString')
      expect(badges[0].label).toBe('title:ukraine')
    })

    it('truncates raw query at 40 characters', () => {
      const badges = summarizeState(querySyntaxState('a'.repeat(50)), articlesFields, t)
      expect(badges[0].label).toBe(`${'a'.repeat(40)}...`)
    })

    it('does not truncate query at exactly 40 characters', () => {
      const badges = summarizeState(querySyntaxState('a'.repeat(40)), articlesFields, t)
      expect(badges[0].label).toBe('a'.repeat(40))
    })
  })

  describe('structured mode', () => {
    it('returns empty badges for empty query', () => {
      const state = createDefaultState(articlesFields)
      expect(summarizeState(state, articlesFields, t)).toEqual([])
    })

    it('returns query badge', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'ukraine'

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'query', label: 'ukraine' })
    })

    it('truncates query at 30 characters', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'a'.repeat(35)

      const badges = summarizeState(state, articlesFields, t)
      expect(badges[0].label).toBe(`${'a'.repeat(30)}...`)
    })

    it('includes exact phrase badge', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.matchType = 'phrase'

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'matchType', label: 'Exact phrase' })
    })

    it('includes booleanAnd badge', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.booleanAnd = true

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'booleanAnd', label: 'Require all terms (AND)' })
    })

    it('includes fuzzy badge with edit distance', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.fuzzy = true
      state.structured.fuzzyEdits = 1

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'fuzzy', label: 'Fuzzy (~1)' })
    })

    it('does not include fuzzy badge when disabled', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.fuzzy = false

      const badges = summarizeState(state, articlesFields, t)
      expect(badges.find((b) => b.key === 'fuzzy')).toBeUndefined()
    })

    it('does not include fields badge when using defaults', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'

      const badges = summarizeState(state, articlesFields, t)
      expect(badges.find((b) => b.key === 'fields')).toBeUndefined()
    })

    it('includes fields badge for custom fields (subset of defaults)', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.selectedFields = ['document.title' as FieldPath]

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'fields', label: 'Fields: Title' })
    })

    it('includes fields badge with multiple labels', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.selectedFields = [
        'document.title' as FieldPath,
        'document.content.core_text.data.text' as FieldPath
      ]

      const badges = summarizeState(state, articlesFields, t)
      const fieldBadge = badges.find((b) => b.key === 'fields')
      expect(fieldBadge?.label).toBe('Fields: Title, Content')
    })

    it('does not show fields badge when same fields as defaults in different order', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      // Reverse the default fields — should still be considered "default"
      state.structured.selectedFields = [...state.structured.selectedFields].reverse()

      const badges = summarizeState(state, articlesFields, t)
      expect(badges.find((b) => b.key === 'fields')).toBeUndefined()
    })

    it('filters out unknown fieldPaths in fields badge', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.selectedFields = ['nonexistent.path' as FieldPath]

      const badges = summarizeState(state, articlesFields, t)
      const fieldBadge = badges.find((b) => b.key === 'fields')
      expect(fieldBadge?.label).toBe('Fields: ')
    })

    it('includes date range badge', () => {
      const state = createDefaultState(articlesFields)
      state.structured.dateRange = { from: '2026-01-01', to: '2026-03-01' }

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'dateRange', label: '2026-01-01 – 2026-03-01' })
    })

    it('includes date range badge with from-only', () => {
      const state = createDefaultState(articlesFields)
      state.structured.dateRange = { from: '2026-01-01', to: '' }

      const badges = summarizeState(state, articlesFields, t)
      const badge = badges.find((b) => b.key === 'dateRange')
      expect(badge?.label).toBe('2026-01-01 –')
    })

    it('includes boost badge when > 1', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.boost = 3

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'boost', label: 'Boost: 3x' })
    })

    it('does not include boost badge when 1', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'

      const badges = summarizeState(state, articlesFields, t)
      expect(badges.find((b) => b.key === 'boost')).toBeUndefined()
    })

    it('includes field exists badge', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.fieldExists = [{ field: 'document.title' as FieldPath, exists: true }]

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'fieldExists', label: 'Title' })
    })

    it('shows negated label for missing fields', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.fieldExists = [{ field: 'document.title' as FieldPath, exists: false }]

      const badges = summarizeState(state, articlesFields, t)
      expect(badges).toContainEqual({ key: 'fieldExists', label: '¬Title' })
    })

    it('includes all badge types simultaneously', () => {
      const state = createDefaultState(articlesFields)
      state.structured.query = 'test'
      state.structured.dateRange = { from: '2026-01-01', to: '' }
      state.structured.matchType = 'phrase'
      state.structured.booleanAnd = true
      state.structured.fuzzy = true
      state.structured.fuzzyEdits = 2
      state.structured.boost = 2
      state.structured.selectedFields = ['document.title' as FieldPath]
      state.structured.fieldExists = [{ field: 'document.title' as FieldPath, exists: true }]

      const badges = summarizeState(state, articlesFields, t)
      const keys = badges.map((b) => b.key)
      expect(keys).toEqual(['query', 'dateRange', 'matchType', 'booleanAnd', 'fuzzy', 'boost', 'fields', 'fieldExists'])
    })
  })
})
