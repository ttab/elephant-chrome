import {
  serializeAdvancedState,
  deserializeAdvancedState,
  hasAdvancedParams,
  clearAdvancedParams
} from '@/components/AdvancedSearch/hooks/useAdvancedSearchParams'
import { createDefaultState, isActiveState, parseAdvancedSearchState, parseAdvancedSearchJson } from '@/components/AdvancedSearch/lib/defaultState'
import { articlesFields } from '@/components/AdvancedSearch/configs'
import type { AdvancedSearchState, FieldPath } from '@/components/AdvancedSearch/types'

function querySyntaxState(raw: string): AdvancedSearchState {
  return {
    mode: 'querySyntax',
    structured: createDefaultState(articlesFields).structured,
    querySyntax: { raw }
  }
}

describe('serializeAdvancedState', () => {
  it('returns empty object for inactive state', () => {
    const state = createDefaultState(articlesFields)
    expect(serializeAdvancedState(state)).toEqual({})
  })

  it('serializes querySyntax mode', () => {
    expect(serializeAdvancedState(querySyntaxState('title:ukraine AND content:crisis'))).toEqual({
      advMode: 'querySyntax',
      advRaw: 'title:ukraine AND content:crisis'
    })
  })

  it('serializes structured mode with defaults', () => {
    const state = createDefaultState(articlesFields)
    state.structured.query = 'ukraine'

    const result = serializeAdvancedState(state)
    expect(result.advMode).toBe('structured')
    expect(result.advQuery).toBe('ukraine')
    expect(result.advMatch).toBeUndefined()
    expect(result.advFuzzy).toBeUndefined()
    expect(result.advAnd).toBeUndefined()
  })

  it('serializes structured mode with all non-default options', () => {
    const state = createDefaultState(articlesFields)
    state.structured.query = 'ukraine'
    state.structured.matchType = 'phrase'
    state.structured.fuzzy = true
    state.structured.fuzzyEdits = 1
    state.structured.booleanAnd = true
    state.structured.selectedFields = ['document.title' as FieldPath]

    const result = serializeAdvancedState(state)
    expect(result).toEqual({
      advMode: 'structured',
      advQuery: 'ukraine',
      advMatch: 'phrase',
      advFuzzy: '1',
      advAnd: '1',
      advFields: 'document.title'
    })
  })

  it('serializes selectedFields as comma-separated', () => {
    const state = createDefaultState(articlesFields)
    state.structured.query = 'test'
    state.structured.selectedFields = [
      'document.title' as FieldPath,
      'document.content.core_text.data.text' as FieldPath
    ]

    const result = serializeAdvancedState(state)
    expect(result.advFields).toBe('document.title,document.content.core_text.data.text')
  })
})

describe('deserializeAdvancedState', () => {
  it('returns default state when no advMode', () => {
    const result = deserializeAdvancedState({}, articlesFields)
    expect(result).toEqual(createDefaultState(articlesFields))
  })

  it('returns default state for invalid advMode', () => {
    const result = deserializeAdvancedState({ advMode: 'foobar' }, articlesFields)
    expect(result).toEqual(createDefaultState(articlesFields))
  })

  it('deserializes querySyntax mode', () => {
    const result = deserializeAdvancedState({
      advMode: 'querySyntax',
      advRaw: 'title:ukraine'
    }, articlesFields)

    expect(result.mode).toBe('querySyntax')
    expect(result.querySyntax.raw).toBe('title:ukraine')
  })

  it('defaults raw to empty string when missing', () => {
    const result = deserializeAdvancedState({
      advMode: 'querySyntax'
    }, articlesFields)

    expect(result.querySyntax.raw).toBe('')
  })

  it('deserializes structured mode with all options', () => {
    const result = deserializeAdvancedState({
      advMode: 'structured',
      advQuery: 'ukraine',
      advFields: 'document.title,document.content.core_text.data.text',
      advMatch: 'phrase',
      advFuzzy: '1',
      advAnd: '1'
    }, articlesFields)

    expect(result.mode).toBe('structured')
    expect(result.structured.query).toBe('ukraine')
    expect(result.structured.selectedFields).toEqual([
      'document.title',
      'document.content.core_text.data.text'
    ])
    expect(result.structured.matchType).toBe('phrase')
    expect(result.structured.fuzzy).toBe(true)
    expect(result.structured.fuzzyEdits).toBe(1)
    expect(result.structured.booleanAnd).toBe(true)
  })

  it('defaults structured options when missing', () => {
    const result = deserializeAdvancedState({
      advMode: 'structured',
      advQuery: 'test'
    }, articlesFields)

    expect(result.structured.matchType).toBe('best_fields')
    expect(result.structured.fuzzy).toBe(false)
    expect(result.structured.fuzzyEdits).toBe(2)
    expect(result.structured.booleanAnd).toBe(false)
    expect(result.structured.selectedFields).toEqual(
      articlesFields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)
    )
  })

  it('defaults query to empty string when missing', () => {
    const result = deserializeAdvancedState({
      advMode: 'structured'
    }, articlesFields)

    expect(result.structured.query).toBe('')
  })

  it('treats invalid advFuzzy as edits=2', () => {
    const result = deserializeAdvancedState({
      advMode: 'structured',
      advQuery: 'test',
      advFuzzy: '3'
    }, articlesFields)

    expect(result.structured.fuzzy).toBe(true)
    expect(result.structured.fuzzyEdits).toBe(2)
  })
})

describe('roundtrip', () => {
  it('serializes and deserializes structured state', () => {
    const original = createDefaultState(articlesFields)
    original.structured.query = 'ukraine crisis'
    original.structured.matchType = 'phrase'
    original.structured.fuzzy = true
    original.structured.fuzzyEdits = 1
    original.structured.booleanAnd = true

    const params = serializeAdvancedState(original)
    const restored = deserializeAdvancedState(params, articlesFields)

    expect(restored.mode).toBe(original.mode)
    expect(restored.structured.query).toBe(original.structured.query)
    expect(restored.structured.matchType).toBe(original.structured.matchType)
    expect(restored.structured.fuzzy).toBe(original.structured.fuzzy)
    expect(restored.structured.fuzzyEdits).toBe(original.structured.fuzzyEdits)
    expect(restored.structured.booleanAnd).toBe(original.structured.booleanAnd)
  })

  it('serializes and deserializes querySyntax state', () => {
    const original = querySyntaxState('title:ukraine AND content:crisis')

    const params = serializeAdvancedState(original)
    const restored = deserializeAdvancedState(params, articlesFields)

    expect(restored.mode).toBe('querySyntax')
    expect(restored.querySyntax.raw).toBe(original.querySyntax.raw)
  })

  it('serializes and deserializes custom selectedFields', () => {
    const original = createDefaultState(articlesFields)
    original.structured.query = 'test'
    original.structured.selectedFields = ['document.title' as FieldPath]

    const params = serializeAdvancedState(original)
    const restored = deserializeAdvancedState(params, articlesFields)

    expect(restored.structured.selectedFields).toEqual(['document.title'])
  })

  it('serializes and deserializes dateRange', () => {
    const original = createDefaultState(articlesFields)
    original.structured.dateRange = { from: '2026-01-01', to: '2026-03-01' }

    const params = serializeAdvancedState(original)
    expect(params.advDateFrom).toBe('2026-01-01')
    expect(params.advDateTo).toBe('2026-03-01')

    const restored = deserializeAdvancedState(params, articlesFields)
    expect(restored.structured.dateRange).toEqual({ from: '2026-01-01', to: '2026-03-01' })
  })

  it('serializes and deserializes boost', () => {
    const original = createDefaultState(articlesFields)
    original.structured.query = 'test'
    original.structured.boost = 3.5

    const params = serializeAdvancedState(original)
    expect(params.advBoost).toBe('3.5')

    const restored = deserializeAdvancedState(params, articlesFields)
    expect(restored.structured.boost).toBe(3.5)
  })

  it('serializes and deserializes fuzzyPrefixLength', () => {
    const original = createDefaultState(articlesFields)
    original.structured.query = 'test'
    original.structured.fuzzy = true
    original.structured.fuzzyPrefixLength = 3

    const params = serializeAdvancedState(original)
    expect(params.advFuzzyPrefix).toBe('3')

    const restored = deserializeAdvancedState(params, articlesFields)
    expect(restored.structured.fuzzyPrefixLength).toBe(3)
  })

  it('serializes and deserializes fieldExists', () => {
    const original = createDefaultState(articlesFields)
    original.structured.fieldExists = [
      { field: 'document.title' as FieldPath, exists: true },
      { field: 'document.content' as FieldPath, exists: false }
    ]

    const params = serializeAdvancedState(original)
    expect(params.advExists).toBe('document.title')
    expect(params.advMissing).toBe('document.content')

    const restored = deserializeAdvancedState(params, articlesFields)
    expect(restored.structured.fieldExists).toContainEqual({ field: 'document.title', exists: true })
    expect(restored.structured.fieldExists).toContainEqual({ field: 'document.content', exists: false })
  })
})

describe('hasAdvancedParams', () => {
  it('returns false when no advMode', () => {
    expect(hasAdvancedParams({})).toBe(false)
    expect(hasAdvancedParams({ query: 'test' })).toBe(false)
  })

  it('returns true when advMode is set', () => {
    expect(hasAdvancedParams({ advMode: 'structured' })).toBe(true)
    expect(hasAdvancedParams({ advMode: 'querySyntax' })).toBe(true)
  })
})

describe('clearAdvancedParams', () => {
  it('returns undefined for all adv keys', () => {
    const result = clearAdvancedParams()
    expect(result.advMode).toBeUndefined()
    expect(result.advQuery).toBeUndefined()
    expect(result.advFields).toBeUndefined()
    expect(result.advMatch).toBeUndefined()
    expect(result.advFuzzy).toBeUndefined()
    expect(result.advFuzzyPrefix).toBeUndefined()
    expect(result.advAnd).toBeUndefined()
    expect(result.advRaw).toBeUndefined()
    expect(result.advDateFrom).toBeUndefined()
    expect(result.advDateTo).toBeUndefined()
    expect(result.advBoost).toBeUndefined()
    expect(result.advExists).toBeUndefined()
    expect(result.advMissing).toBeUndefined()
  })
})

describe('isActiveState', () => {
  it('returns false for default state', () => {
    expect(isActiveState(createDefaultState(articlesFields))).toBe(false)
  })

  it('returns true for structured mode with query', () => {
    const state = createDefaultState(articlesFields)
    state.structured.query = 'test'
    expect(isActiveState(state)).toBe(true)
  })

  it('returns false for structured mode with whitespace-only query', () => {
    const state = createDefaultState(articlesFields)
    state.structured.query = '   '
    expect(isActiveState(state)).toBe(false)
  })

  it('returns true for querySyntax mode with raw', () => {
    expect(isActiveState(querySyntaxState('test'))).toBe(true)
  })

  it('returns false for querySyntax mode with empty raw', () => {
    expect(isActiveState(querySyntaxState(''))).toBe(false)
  })

  it('returns true for from-only date range', () => {
    const state = createDefaultState(articlesFields)
    state.structured.dateRange = { from: '2026-01-01', to: '' }
    expect(isActiveState(state)).toBe(true)
  })

  it('returns true for to-only date range', () => {
    const state = createDefaultState(articlesFields)
    state.structured.dateRange = { from: '', to: '2026-03-01' }
    expect(isActiveState(state)).toBe(true)
  })

  it('returns true for field exists only', () => {
    const state = createDefaultState(articlesFields)
    state.structured.fieldExists = [{ field: 'document.title' as FieldPath, exists: true }]
    expect(isActiveState(state)).toBe(true)
  })
})

describe('parseAdvancedSearchState', () => {
  it('returns valid state for a full AdvancedSearchState object', () => {
    const input = createDefaultState(articlesFields)
    input.structured.query = 'test'
    const result = parseAdvancedSearchState(input, articlesFields)
    expect(result).toBeDefined()
    expect(result?.structured.query).toBe('test')
  })

  it('returns undefined for null', () => {
    expect(parseAdvancedSearchState(null)).toBeUndefined()
  })

  it('returns undefined for primitives', () => {
    expect(parseAdvancedSearchState('string')).toBeUndefined()
    expect(parseAdvancedSearchState(42)).toBeUndefined()
    expect(parseAdvancedSearchState(true)).toBeUndefined()
  })

  it('returns undefined for arrays', () => {
    expect(parseAdvancedSearchState([])).toBeUndefined()
  })

  it('returns undefined when mode is invalid', () => {
    expect(parseAdvancedSearchState({
      mode: 'invalid',
      structured: { query: '' },
      querySyntax: { raw: '' }
    })).toBeUndefined()
  })

  it('returns undefined when structured is missing', () => {
    expect(parseAdvancedSearchState({
      mode: 'structured',
      querySyntax: { raw: '' }
    })).toBeUndefined()
  })

  it('returns undefined when structured.query is not a string', () => {
    expect(parseAdvancedSearchState({
      mode: 'structured',
      structured: { query: 123 },
      querySyntax: { raw: '' }
    })).toBeUndefined()
  })

  it('returns undefined when querySyntax.raw is not a string', () => {
    expect(parseAdvancedSearchState({
      mode: 'structured',
      structured: { query: '' },
      querySyntax: { raw: 42 }
    })).toBeUndefined()
  })

  it('merges missing fields with defaults', () => {
    const minimal = {
      mode: 'structured',
      structured: { query: 'test' },
      querySyntax: { raw: '' }
    }
    const result = parseAdvancedSearchState(minimal, articlesFields)
    expect(result).toBeDefined()
    expect(result?.structured.matchType).toBe('best_fields')
    expect(result?.structured.fuzzy).toBe(false)
    expect(result?.structured.fuzzyEdits).toBe(2)
    expect(result?.structured.boost).toBe(1)
    expect(result?.structured.dateRange).toEqual({ from: '', to: '' })
    expect(result?.structured.fieldExists).toEqual([])
  })
})

describe('parseAdvancedSearchJson', () => {
  it('returns state for valid JSON', () => {
    const state = createDefaultState(articlesFields)
    state.structured.query = 'test'
    const json = JSON.stringify(state)
    const result = parseAdvancedSearchJson(json, 'test', articlesFields)
    expect(result?.structured.query).toBe('test')
  })

  it('returns undefined for invalid JSON', () => {
    expect(parseAdvancedSearchJson('not json', 'test')).toBeUndefined()
  })

  it('returns undefined for valid JSON that fails shape validation', () => {
    expect(parseAdvancedSearchJson('{"foo":"bar"}', 'test')).toBeUndefined()
  })

  it('returns undefined for JSON array', () => {
    expect(parseAdvancedSearchJson('[1,2,3]', 'test')).toBeUndefined()
  })
})
