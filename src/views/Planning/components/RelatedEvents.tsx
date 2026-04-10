import { Link } from '@/components/index'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Separator } from '@ttab/elephant-ui'
import { CalendarPlus2Icon } from '@ttab/elephant-ui/icons'

export const RelatedEvents = ({ events = [] }: { events: Block[] | undefined }) => {
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
          <div className='text-muted-foreground py-2'>Länkade händelser</div>
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
