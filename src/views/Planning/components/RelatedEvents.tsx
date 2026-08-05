import { Link } from '@/components/index'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { BoolQueryV1, type HitV1, QueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import { CalendarPlus2Icon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'

type RelatedEventFields = ['document.title']

export const RelatedEvents = ({ events = [] }: { events: Block[] | undefined }) => {
  const { t } = useTranslation()
  const eventUuids = events.map((ev) => ev.uuid)

  // Resolve the current event titles from the index by uuid. The title stored in
  // the planning's link block is only a snapshot from when the link was created, so
  // it goes stale when the event's headline changes. `subscribe: true` keeps it live.
  const { data } = useDocuments<HitV1, RelatedEventFields>({
    documentType: 'core/event',
    fields: ['document.title'],
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: '_id',
                values: eventUuids
              })
            }
          }]
        })
      }
    }),
    options: {
      subscribe: true
    },
    disabled: eventUuids.length === 0
  })

  if (!events || events?.length < 1) {
    return <></>
  }

  const titleByUuid = new Map<string, string>()

  for (const hit of data ?? []) {
    const title = hit.fields['document.title']?.values[0]

    if (title) {
      titleByUuid.set(hit.id, title)
    }
  }

  return (
    <div className='flex items-center gap-2 flex-wrap pl-6 pt-8 pb-2'>
      <CalendarPlus2Icon
        color='#D802FD'
        strokeWidth={1.75}
        size={18}
        className='text-muted-foreground'
      />
      <span className='text-muted-foreground'>{t('planning:related.relatedEvents')}</span>
      {events.map((ev) => (
        <Link
          to='Event'
          props={{ id: ev.uuid }}
          target='last'
          key={ev.uuid}
          className='text-sm hover:bg-gray-100 dark:hover:bg-table-focused px-1 rounded-sm underline'
        >
          {titleByUuid.get(ev.uuid) ?? ev.title}
        </Link>
      ))}
    </div>
  )
}
