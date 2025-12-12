import { useLink } from '@/hooks/useLink'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { CalendarDaysIcon, CalendarPlus2Icon, FileInputIcon } from '@ttab/elephant-ui/icons'
import type { JSX } from 'react'

export const ToastAction = ({ planningId, quickArticleid, flashId, eventId, view }: {
  planningId?: string
  flashId?: string
  eventId?: string
  quickArticleid?: string
  view: 'Flash' | 'QuickArticle' | 'Event' | 'Planning'
}): JSX.Element => {
  const openType = useLink(view)
  const openPlanning = useLink('Planning')
  const openEvent = useLink('Event')

  return (
    <div className='flex flex-row w-full gap-2 justify-end'>
      {planningId && (
        <Tooltip
          content='Öppna planering'
        >
          <Button
            variant='icon'
            onClick={(event) => openPlanning(event, { id: planningId }, 'last')}
          >
            <CalendarDaysIcon size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
      {quickArticleid && (
        <Tooltip
          content='Öppna snabbartikel'
        >
          <Button
            variant='icon'
            onClick={(event) => openType(event, { id: quickArticleid }, 'last')}
          >
            <FileInputIcon size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
      {flashId && (
        <Tooltip
          content='Öppna flash'
        >
          <Button
            variant='icon'
            onClick={(event) => openType(event, { id: flashId }, 'last')}
          >
            <FileInputIcon size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
      {eventId && (
        <Tooltip
          content='Öppna händelse'
        >
          <Button
            variant='icon'
            onClick={(event) => openEvent(event, { id: eventId }, 'last')}
          >
            <CalendarPlus2Icon size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
    </div>
  )
}
