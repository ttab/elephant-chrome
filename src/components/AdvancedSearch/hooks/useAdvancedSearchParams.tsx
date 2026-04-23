import { useCallback, useMemo } from 'react'
import type { QueryParams } from '@/hooks/useQuery'
import type { AdvancedSearchState, FieldPath, SearchFieldConfig } from '../types'
import { createDefaultState, isActiveState } from '../lib/defaultState'

const ADV_KEYS = ['advMode', 'advName', 'advQuery', 'advFields', 'advMatch', 'advFuzzy', 'advFuzzyPrefix', 'advAnd', 'advRaw', 'advDateFrom', 'advDateTo', 'advBoost', 'advExists', 'advMissing'] as const

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function serializeAdvancedState(state: AdvancedSearchState): QueryParams {
  if (!isActiveState(state)) {
    return {}
  }

  if (state.mode === 'querySyntax') {
    const params: QueryParams = {
      advMode: 'querySyntax',
      advRaw: state.querySyntax.raw
    }
    if (state.name) {
      params.advName = state.name
    }
    return params
  }

  const params: QueryParams = {
    advMode: 'structured',
    advQuery: state.structured.query
  }

  if (state.name) {
    params.advName = state.name
  }

  if (state.structured.selectedFields.length > 0) {
    params.advFields = state.structured.selectedFields.join(',')
  }

  if (state.structured.matchType !== 'best_fields') {
    params.advMatch = state.structured.matchType
  }

  if (state.structured.fuzzy) {
    params.advFuzzy = String(state.structured.fuzzyEdits)
    if (state.structured.fuzzyPrefixLength > 0) {
      params.advFuzzyPrefix = String(state.structured.fuzzyPrefixLength)
    }
  }

  if (state.structured.booleanAnd) {
    params.advAnd = '1'
  }

  if (state.structured.dateRange.from) {
    params.advDateFrom = state.structured.dateRange.from
  }

  if (state.structured.dateRange.to) {
    params.advDateTo = state.structured.dateRange.to
  }

  if (state.structured.boost > 1) {
    params.advBoost = String(state.structured.boost)
  }

  const existsFields = state.structured.fieldExists.filter((fe) => fe.exists).map((fe) => fe.field)
  const missingFields = state.structured.fieldExists.filter((fe) => !fe.exists).map((fe) => fe.field)
  if (existsFields.length > 0) {
    params.advExists = existsFields.join(',')
  }
  if (missingFields.length > 0) {
    params.advMissing = missingFields.join(',')
  }

  return params
}

export function deserializeAdvancedState(
  filter: QueryParams,
  fields: SearchFieldConfig[]
): AdvancedSearchState {
  const mode = firstString(filter.advMode)
  if (!mode || (mode !== 'querySyntax' && mode !== 'structured')) {
    return createDefaultState(fields)
  }

  const name = String(filter.advName || '')

  if (mode === 'querySyntax') {
    return {
      mode: 'querySyntax',
      name,
      structured: createDefaultState(fields).structured,
      querySyntax: {
        raw: String(filter.advRaw || '')
      }
    }
  }

  const advFields = firstString(filter.advFields)
  const selectedFields = advFields ? advFields.split(',') as FieldPath[] : fields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)
  const fuzzyStr = firstString(filter.advFuzzy)
  const fuzzyPrefixStr = firstString(filter.advFuzzyPrefix)
  const boostStr = firstString(filter.advBoost)
  const existsStr = firstString(filter.advExists)
  const missingStr = firstString(filter.advMissing)

  const fieldExists: { field: FieldPath, exists: boolean }[] = [
    ...(existsStr ? existsStr.split(',').map((f) => ({ field: f as FieldPath, exists: true })) : []),
    ...(missingStr ? missingStr.split(',').map((f) => ({ field: f as FieldPath, exists: false })) : [])
  ]

  const fuzzyEdits = fuzzyStr === '1' ? 1 : fuzzyStr === '2' ? 2 : 'auto'

  return {
    mode: 'structured',
    name,
    structured: {
      query: String(filter.advQuery || ''),
      selectedFields,
      matchType: String(filter.advMatch || '') === 'phrase' ? 'phrase' : 'best_fields',
      fuzzy: !!fuzzyStr,
      fuzzyEdits,
      fuzzyPrefixLength: Math.max(0, Math.min(5, Number(fuzzyPrefixStr) || 0)),
      booleanAnd: filter.advAnd === '1',
      boost: Math.max(1, Math.min(10, Number(boostStr) || 1)),
      dateRange: {
        from: String(filter.advDateFrom || ''),
        to: String(filter.advDateTo || '')
      },
      fieldExists
    },
    querySyntax: { raw: '' }
  }
}

export function hasAdvancedParams(filter: QueryParams): boolean {
  return !!filter.advMode
}

export function clearAdvancedParams(): QueryParams {
  const params: QueryParams = {}
  for (const key of ADV_KEYS) {
    params[key] = undefined
  }
  return params
}

export function useAdvancedSearchParams(
  filter: QueryParams,
  fields: SearchFieldConfig[],
  setQueryString: (params: QueryParams) => void
) {
  const advCacheKey = ADV_KEYS.map((k) => filter[k] ?? '').join('|')

  const state = useMemo(
    () => deserializeAdvancedState(filter, fields),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recompute when adv* params change
    [advCacheKey, fields]
  )

  const isAdvancedActive = !!filter.advMode

  const applyAdvancedSearch = useCallback(
    (newState: AdvancedSearchState) => {
      const advParams = serializeAdvancedState(newState)
      // Advanced and basic search are mutually exclusive
      setQueryString({
        ...advParams,
        query: undefined
      })
    },
    [setQueryString]
  )

  const clearAdvancedSearch = useCallback(
    () => {
      setQueryString(clearAdvancedParams())
    },
    [setQueryString]
  )

  return {
    state,
    isAdvancedActive,
    applyAdvancedSearch,
    clearAdvancedSearch
  }
}
