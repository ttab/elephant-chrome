import { Link } from '@/components/index'
import { useDocuments } from '@/hooks/index/useDocuments'
import { type CopyGroupFields, copyGroupFields } from '@/lib/getSharedFields'
import { TermsQueryV1, BoolQueryV1, type HitV1, QueryV1 } from '@ttab/elephant-api/index'
import { CalendarPlus2Icon } from '@ttab/elephant-ui/icons'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

export const CopyGroup = ({ copyGroupId, type }: { copyGroupId: string, type: 'core/event' | 'core/planning-item' }) => {
  const fields: CopyGroupFields = copyGroupFields(type)
  const { t } = useTranslation()

  const { data } = useDocuments<HitV1, CopyGroupFields>({
    documentType: type,
    fields,
    query: QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({
                field: '_id',
                values: [copyGroupId]
              })
            }
          }]
        })
      }
    }),
    options: {
      subscribe: true
    }
  })

  if (!Array.isArray(data) || (Array.isArray(data) && data?.length === 0)) {
    return <></>
  }

  return (
    <div className='pl-6 border-t'>
      <div className='text-sm font-bold pt-2'>{t('shared:copy.copiedFrom')}</div>
      {data.map((original) => {
        const [title] = original.fields['document.title'].values
        let start

        if (type === 'core/event') {
          start = format(new Date(original.fields['document.meta.core_event.data.start']?.values[0]), 'yyyy-MM-dd')
        }

        if (type === 'core/planning-item') {
          start = format(new Date(original.fields['document.meta.core_planning_item.data.start_date']?.values[0]), 'yyyy-MM-dd')
        }

        return (
          <div key={original.id} className='flex flex-col gap-2'>
            <div key={original.id} className='py-1 hover:bg-gray-100 dark:hover:bg-table-focused'>
              <Link to={type === 'core/event' ? 'Event' : 'Planning'} props={{ id: original.id }} target='last'>
                <div className='flex items-center gap-2 text-sm'>
                  <CalendarPlus2Icon strokeWidth={1.75} size={18} className='text-muted-foreground' />
                  <div>{title}</div>
                  {start && <div>{`(${start})`}</div>}
                </div>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
