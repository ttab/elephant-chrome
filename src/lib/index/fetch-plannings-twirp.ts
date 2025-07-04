import { NewsvalueMap } from '@/defaults/newsvalueMap'
import type { Index } from '@/shared/Index'
import { QueryV1, BoolQueryV1, MultiMatchQueryV1, RangeQueryV1 } from '@ttab/elephant-api/index'
import type { Session } from 'next-auth'
import { toast } from 'sonner'
import type { LocaleData } from '@/types/index'
import { dateInTimestampOrShortMonthDayYear } from '../datetime'
import { UTCDate } from '@date-fns/utc'

export const fetch = async (
  query: string,
  session: Session | null,
  index?: Index,
  locale?: LocaleData,
  timeZone?: string,
  options?: {
    searchOlder?: boolean // should we search older than today?
    sluglines?: boolean // should we fetch all sluglines?
  }
) => {
  if (!session?.accessToken || !index) {
    return []
  }

  const todayMidnightUTC = new UTCDate(new UTCDate().setHours(0, 0, 0, 0)).toISOString()

  const fields = [
    'document.title',
    'document.meta.core_newsvalue.value',
    'document.meta.tt_slugline.value',
    'document.rel.section.title',
    'document.rel.section.uuid',
    'document.meta.core_planning_item.data.start_date'
  ]

  // Append to query so we'll have all sluglines available in result
  if (options?.sluglines) {
    fields.push('document.meta.core_assignment.meta.tt_slugline.value')
  }

  const { ok, hits, errorMessage } = await index.query({
    accessToken: session.accessToken,
    documentType: 'core/planning-item',
    page: 1,
    size: 100,
    sort: [
      { field: 'document.meta.core_planning_item.data.start_date', desc: !!options?.searchOlder },
      { field: 'modified', desc: true }
    ],
    fields,
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [
            {
              conditions: {
                oneofKind: 'multiMatch',
                multiMatch: MultiMatchQueryV1.create({
                  fields: ['document.title', 'document.rel.section.title'],
                  query,
                  type: 'phrase_prefix'
                })
              }
            },
            ...(options?.searchOlder
              ? []
              : [{
                  conditions: {
                    oneofKind: 'range' as const,
                    range: RangeQueryV1.create({
                      field: 'document.meta.core_planning_item.data.start_date',
                      gte: todayMidnightUTC
                    })
                  }
                }])
          ]
        })
      }
    })
  })

  if (!ok) {
    toast.error('Kunde inte hämta planeringar')
    console.error(errorMessage || 'Unknown error while searching for planning items')
    return []
  }

  const newOptions = hits.map((planning) => {
    const id = planning.id
    const title = planning.fields['document.title']?.values?.[0]
    const newsvalue = NewsvalueMap[planning.fields['document.meta.core_newsvalue.value']?.values?.[0]] || {}
    const slugline = planning.fields['document.meta.tt_slugline.value']?.values?.[0]

    const info = [
      slugline,
      planning.fields['document.rel.section.title']?.values?.[0],
      locale && timeZone
        ? dateInTimestampOrShortMonthDayYear(
          planning.fields['document.meta.core_planning_item.data.start_date']?.values?.[0],
          locale.code.full,
          timeZone
        )
        : ''
    ].filter((v) => v).join(', ')

    return {
      value: id,
      label: title,
      info: info ? ` - ${info}` : '',
      icon: newsvalue.icon,
      iconProps: newsvalue.iconProps,
      payload: {
        slugline,
        sluglines: planning.fields['document.meta.core_assignment.meta.tt_slugline.value']?.values,
        section: planning.fields['document.rel.section.uuid']?.values?.[0],
        startDate: planning.fields['document.meta.core_planning_item.data.start_date']?.values?.[0]
      }
    }
  })

  return newOptions
}

