import type { HitV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import { fetch } from '@/hooks/index/useDocuments/lib/fetch'
import type { Index } from '@/shared/Index'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'

export async function withPlannings({ hits, session, index }: {
  hits: HitV1[]
  session: Session | null
  index?: Index
}): Promise<HitV1[]> {
  if (!session || !index) return hits

  const eventIDs: string[] = hits?.map((hit) => hit?.id)

  const plannings = await fetch({
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
          }
          ]
        })
      }
    })
  })


  const hasPlannings = plannings?.map((hit) => hit.fields['document.rel.event.uuid']?.values[0])
  return hits.map((hit) => {
    const relatedItemIndex = hasPlannings?.findIndex((item) => item === hit.id)
    if (relatedItemIndex && relatedItemIndex !== -1 && hasPlannings?.length) {
      return {
        ...hit,
        _relatedPlannings: hasPlannings[relatedItemIndex]
      }
    }
    return hit
  })
}
