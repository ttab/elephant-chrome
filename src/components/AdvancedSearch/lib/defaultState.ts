import type { AdvancedSearchState, SearchFieldConfig } from '../types'

export function createDefaultState(fields: SearchFieldConfig[]): AdvancedSearchState {
  return {
    mode: 'structured',
    structured: {
      query: '',
      selectedFields: fields.filter((f) => f.defaultSelected).map((f) => f.fieldPath),
      matchType: 'best_fields',
      fuzzy: false,
      fuzzyEdits: 2,
      booleanAnd: false
    },
    querySyntax: {
      raw: ''
    }
  }
}

export function isActiveState(state: AdvancedSearchState): boolean {
  if (state.mode === 'querySyntax') {
    return state.querySyntax.raw.trim().length > 0
  }
  return state.structured.query.trim().length > 0
}

/**
 * Validates that a parsed JSON value has the minimum shape of AdvancedSearchState.
 * Use at deserialization boundaries (JSON.parse, URL params) to avoid unsafe `as` casts.
 */
export function parseAdvancedSearchState(value: unknown): AdvancedSearchState | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const obj = value as Record<string, unknown>
  if (obj.mode !== 'structured' && obj.mode !== 'querySyntax') return undefined
  if (typeof obj.structured !== 'object' || obj.structured === null) return undefined
  if (typeof obj.querySyntax !== 'object' || obj.querySyntax === null) return undefined

  const structured = obj.structured as Record<string, unknown>
  if (typeof structured.query !== 'string') return undefined

  const qs = obj.querySyntax as Record<string, unknown>
  if (typeof qs.raw !== 'string') return undefined

  return value as AdvancedSearchState
}

/**
 * Parse a JSON string into a validated AdvancedSearchState.
 * Combines JSON.parse with shape validation; logs on failure.
 */
export function parseAdvancedSearchJson(value: string, context?: string): AdvancedSearchState | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch (err) {
    console.error(`[${context ?? 'parseAdvancedSearchJson'}] Failed to parse JSON:`, err)
    return undefined
  }
  return parseAdvancedSearchState(parsed)
}
