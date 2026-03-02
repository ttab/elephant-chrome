import type { ExtractedValue, ExtractedValues } from '@ttab/elephant-api/repository'

/**
 * Get the first extracted value string at a given extractor index.
 * Returns undefined if subset is missing or the extractor has no values.
 */
export function fromSubset(subset: ExtractedValues[] | undefined, index: number): string | undefined {
  if (!subset) return undefined
  const extracted = subset.find((e) => e.extractor === BigInt(index))
  if (!extracted) return undefined
  const entries: ExtractedValue[] = Object.values(extracted.values as Record<string, ExtractedValue>)
  return entries[0]?.value || undefined
}

/**
 * Get all extracted value strings at a given extractor index.
 * Returns an empty array if subset is missing or the extractor has no values.
 */
export function allFromSubset(subset: ExtractedValues[] | undefined, index: number): string[] {
  if (!subset) return []
  const target = BigInt(index)
  return subset
    .filter((e) => e.extractor === target)
    .flatMap((e) => {
      const entries: ExtractedValue[] = Object.values(e.values as Record<string, ExtractedValue>)
      return entries.map((v) => v.value)
    })
    .filter(Boolean)
}
