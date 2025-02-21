import { NewsvalueMap } from '@/defaults/newsvalueMap'
import type { Index } from '@/shared/Index'
import { QueryV1, BoolQueryV1, MultiMatchQueryV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'

// TODO: Adapt and replace http query from index
export const fetch = async (query: string, session: Session | null, index?: Index) => {
  if (!session?.accessToken || !index) {
    return []
  }

  const { ok, hits, errorMessage } = await index.query({
    accessToken: session.accessToken,
    documentType: 'core/planning-item',
    page: 1,
    size: 100,
    sort: [{ field: 'modified', desc: true }],
    fields: ['document.title', 'document.meta.core_newsvalue.value'],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          should: [
            {
              conditions: {
                oneofKind: 'multiMatch',
                multiMatch: MultiMatchQueryV1.create({
                  fields: ['document.title', 'document.rel.section.title'],
                  query,
                  type: 'phrase_prefix'
                })
              }
            }
          ]
        })
      }
    })
  })
  if (!ok) {
    console.error(errorMessage || 'Unknown error while searching for planning items')
    return []
  }

  const newOptions = hits.map((planning) => {
    const id = planning.id
    const title = planning.fields['document.title']?.values?.[0]
    const newsvalue = NewsvalueMap[planning.fields['document.meta.core_newsvalue.value']?.values?.[0]] || {}

    const info = [
      planning.fields['document.meta.tt_slugline.value']?.values?.[0],
      planning.fields['document.rel.section.title']?.values?.[0]
    ].filter((v) => v).join(', ')

    return {
      value: id,
      label: title,
      info: info ? ` - ${info}` : '',
      icon: newsvalue.icon,
      iconProps: newsvalue.iconProps
    }
  })

  return newOptions
}

