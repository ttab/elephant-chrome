import { CalendarPlus2 } from '@ttab/elephant-ui/icons'
import type { FormProps } from '@/components/Form/Root'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { useRef } from 'react'
import { Link } from '@/components/index'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { HitV1 } from '@ttab/elephant-api/index'
import { BoolQueryV1, QueryV1, SortingV1, TermsQueryV1 } from '@ttab/elephant-api/index'

type DuplicateFields = ['document.title']

export const DuplicatesTable = ({ documentId }: {
  documentId: string
} & FormProps): JSX.Element => {
  const createdDocumentIdRef = useRef<string | undefined>()

  const { data, mutate, error, isLoading } = useDocuments<HitV1, DuplicateFields>({
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

  useRepositoryEvents('core/event', (event) => {
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

  if (!data?.length) {
    return <></>
  }

  return (
    <div className='pl-6 border-t'>
      <div className='text-sm font-bold pt-2'>Duplicerade händelser</div>
      {data?.map((duplicate) => (
        <div key={duplicate.id} className='pt-2'>
          <Link to='Event' props={{ id: duplicate.id }} target='last'>
            <div className='flex items-center gap-2'>
              <CalendarPlus2 strokeWidth={1.75} size={18} className='text-muted-foreground' />
              <div className='text-sm'>{duplicate.fields['document.title']?.values[0]}</div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
