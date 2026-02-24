import { Link } from '@/components/index'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Separator } from '@ttab/elephant-ui'
import { CalendarPlus2Icon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'

export const RelatedEvents = ({ events = [] }: { events: Block[] | undefined }) => {
  const { t } = useTranslation()

  if (!events || events?.length < 1) {
    return <></>
  }

  return (
    <>
      <Separator />
      <div className='pl-6'>
        <div className='flex items-center gap-2'>
          <CalendarPlus2Icon
            color='#D802FD'
            strokeWidth={1.75}
            size={18}
            className='text-muted-foreground'
          />
          {/* Länkade händelser */}
          <div className='text-muted-foreground py-2'>{t('planning:related.relatedEvents')}</div>
        </div>
        <div>
          {events.map((ev) => (
            <Link
              to='Event'
              props={{ id: ev.uuid }}
              target='last'
              key={ev.uuid}
              className='w-fit text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-table-focused p-1 rounded-sm'
            >
              {ev.title}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
