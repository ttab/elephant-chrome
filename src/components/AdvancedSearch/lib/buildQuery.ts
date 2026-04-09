import {
  QueryV1,
  BoolQueryV1,
  MultiMatchQueryV1,
  RangeQueryV1,
  Fuzziness
} from '@ttab/elephant-api/index'
import type { AdvancedSearchState, SearchFieldConfig } from '../types'

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Replace user-friendly field aliases with actual OpenSearch field paths
 * in a query syntax string. E.g. `title:"ukraine"` -> `document.title:"ukraine"`
 * Uses word boundaries to avoid matching substrings (e.g. 'subtitle:' won't match the 'title' alias).
 */
function replaceFieldAliases(raw: string, fields: SearchFieldConfig[]): string {
  let result = raw
  for (const field of fields) {
    const pattern = new RegExp(`\\b${escapeRegExp(field.syntaxAlias)}:`, 'g')
    result = result.replace(pattern, `${field.fieldPath}:`)
  }
  return result
}

export function buildAdvancedQuery(
  state: AdvancedSearchState,
  fields: SearchFieldConfig[],
  dateField?: string
): QueryV1 | undefined {
  if (state.mode === 'querySyntax') {
    const raw = state.querySyntax.raw.trim()
    if (!raw) {
      return undefined
    }

    return QueryV1.create({
      conditions: {
        oneofKind: 'queryString',
        queryString: replaceFieldAliases(raw, fields)
      }
    })
  }

  const s = state.structured
  const conditions: QueryV1[] = []

  // Text query
  const query = s.query.trim()
  if (query) {
    const selectedFields = s.selectedFields.length > 0
      ? s.selectedFields
      : fields.filter((f) => f.defaultSelected).map((f) => f.fieldPath)

    const multiMatch = MultiMatchQueryV1.create({
      fields: selectedFields,
      query,
      type: s.matchType,
      booleanAnd: s.booleanAnd,
      boost: s.boost > 1 ? s.boost : 0
    })

    if (s.fuzzy) {
      multiMatch.fuzziness = Fuzziness.create({
        edits: BigInt(s.fuzzyEdits)
      })
      if (s.fuzzyPrefixLength > 0) {
        multiMatch.prefixLength = BigInt(s.fuzzyPrefixLength)
      }
    }

    conditions.push(QueryV1.create({
      conditions: { oneofKind: 'multiMatch', multiMatch }
    }))
  }

  // Date range
  if (dateField && (s.dateRange.from || s.dateRange.to)) {
    const range = RangeQueryV1.create({ field: dateField })
    if (s.dateRange.from) {
      range.gte = s.dateRange.from
    }
    if (s.dateRange.to) {
      range.lte = s.dateRange.to
    }
    conditions.push(QueryV1.create({
      conditions: { oneofKind: 'range', range }
    }))
  }

  // Field exists / missing
  for (const fe of s.fieldExists) {
    const existsQuery = QueryV1.create({
      conditions: { oneofKind: 'exists', exists: fe.field }
    })
    if (fe.exists) {
      conditions.push(existsQuery)
    } else {
      conditions.push(QueryV1.create({
        conditions: {
          oneofKind: 'bool',
          bool: BoolQueryV1.create({ mustNot: [existsQuery] })
        }
      }))
    }
  }

  if (conditions.length === 0) {
    return undefined
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return QueryV1.create({
    conditions: {
      oneofKind: 'bool',
      bool: BoolQueryV1.create({ must: conditions })
    }
  })
}
