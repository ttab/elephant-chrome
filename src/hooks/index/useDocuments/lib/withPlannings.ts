import type { HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import { fetch } from '@/hooks/index/useDocuments/lib/fetch'
import type { Index } from '@/shared/Index'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'

type withPlanningsFields = ['document.rel.event.uuid']

export async function withPlannings<T extends HitV1>({ hits, session, index }: {
  hits: T[]
  session: Session | null
  index?: Index
}): Promise<T[]> {
  if (!session || !index) return hits

  const eventIDs: string[] = hits.map((hit) => hit.id).filter(Boolean)

  // No events means there are no related plannings to look up. Skip the query:
  // a `terms` query with an empty `values` is serialized without `values` at
  // all, which the index rejects with a 500 (seen on dates that have no events).
  if (eventIDs.length === 0) {
    return hits
  }

  const plannings = await fetch<HitV1, withPlanningsFields>({
    documentType: 'core/planning-item',
    index,
    session,
    fields: ['document.rel.event.uuid'],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: 'document.rel.event.uuid',
                values: eventIDs
              })
            }
          }]
        })
      }
    })
  })

  const hasPlannings = plannings.map((hit) => hit.fields['document.rel.event.uuid']?.values[0] || '')

  return hits.map((hit) => {
    const relatedItemIndex = hasPlannings.findIndex((item) => item === hit.id)
    return {
      ...hit,
      _relatedPlannings: relatedItemIndex !== -1 ? hasPlannings[relatedItemIndex] : ''
    }
  })
}
