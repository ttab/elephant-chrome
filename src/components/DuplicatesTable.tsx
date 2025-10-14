import { CalendarPlus2Icon } from '@ttab/elephant-ui/icons'
import type { FormProps } from '@/components/Form/Root'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { useRef } from 'react'
import { Link } from '@/components/index'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { HitV1 } from '@ttab/elephant-api/index'
import { BoolQueryV1, QueryV1, SortingV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import { format } from 'date-fns'
import { duplicateFields, type DuplicateFields } from '@/lib/getSharedFields'

export const DuplicatesTable = ({ documentId, type }: {
  documentId: string
  type: 'core/event' | 'core/planning-item'
} & FormProps): JSX.Element => {
  const createdDocumentIdRef = useRef<string | undefined>()

  const { data, mutate, error, isLoading } = useDocuments<HitV1, DuplicateFields>({
    documentType: type,
    fields: duplicateFields(type),
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: 'document.meta.core_copy_group.uuid',
                values: [documentId]
              })
            }
          }]
        })
      }
    }),
    sort: [
      SortingV1.create({ field: 'modified', desc: true })
    ],
    options: {
      subscribe: true
    }
  })

  useRepositoryEvents(type, (event) => {
    if (createdDocumentIdRef.current === event.uuid && event.type === 'document') {
      void (async () => {
        try {
          await mutate()
        } catch (error) {
          console.warn('Failed to update event item', error)
        }
      })()
    }
  })

  if (isLoading) {
    return <>Loading...</>
  }

  if (error) {
    return <pre>{error.message}</pre>
  }

  if (!data?.result.length) {
    return <></>
  }

  return (
    <div className='pl-6 border-t'>
      <div className='text-sm font-bold pt-2'>Kopierad till</div>
      {data?.result.map((duplicate) => {
        let start, end
        const title = duplicate.fields['document.title']?.values[0]

        if (type === 'core/event') {
          start = format(new Date(duplicate.fields['document.meta.core_event.data.start']?.values[0]), 'yyyy-MM-dd')
          end = format(new Date(duplicate.fields['document.meta.core_event.data.end']?.values[0]), 'yyyy-MM-dd')
        }

        if (type === 'core/planning-item') {
          start = format(new Date(duplicate.fields['document.meta.core_planning_item.data.start_date']?.values[0]), 'yyyy-MM-dd')
        }

        const dateFormatted = `(${(start === end) || (start && !end) ? start : `${start} - ${end}`})`

        return (
          <div key={duplicate.id} className='py-1 hover:bg-gray-100 dark:hover:bg-gray-700'>
            <Link to={type === 'core/event' ? 'Event' : 'Planning'} props={{ id: duplicate.id }} target='last'>
              <div className='flex items-center gap-2 text-sm'>
                <CalendarPlus2Icon strokeWidth={1.75} size={18} className='text-muted-foreground' />
                <div>{title}</div>
                <div>{dateFormatted}</div>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
