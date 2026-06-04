import { Link } from '@/components/index'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { CalendarPlus2Icon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'

export const RelatedEvents = ({ events = [] }: { events: Block[] | undefined }) => {
  const { t } = useTranslation()

  if (!events || events?.length < 1) {
    return <></>
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
          {ev.title}
        </Link>
      ))}
    </div>
  )
}
