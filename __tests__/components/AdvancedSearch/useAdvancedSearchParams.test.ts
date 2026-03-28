import {
  serializeAdvancedState,
  deserializeAdvancedState,
  hasAdvancedParams,
  clearAdvancedParams
} from '@/components/AdvancedSearch/hooks/useAdvancedSearchParams'
import { createDefaultState, isActiveState } from '@/components/AdvancedSearch/lib/defaultState'
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
    expect(result.advAnd).toBeUndefined()
    expect(result.advRaw).toBeUndefined()
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
})
