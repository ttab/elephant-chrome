import { useLink } from '@/hooks/useLink'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { CalendarDaysIcon, CalendarPlus2, FileInput } from '@ttab/elephant-ui/icons'

export const ToastAction = ({ planningId, flashId, eventId }: {
  planningId?: string
  flashId?: string
  eventId?: string
}): JSX.Element => {
  const openFlash = useLink('Flash')
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
            onClick={(event) => openPlanning(event, { id: planningId })}
          >
            <CalendarDaysIcon size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
      {flashId && (
        <Tooltip
          content='Öppna flash'
        >
          <Button
            variant='icon'
            onClick={(event) => openFlash(event, { id: flashId })}
          >
            <FileInput size={16} strokeWidth={1.75} />
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
            <CalendarPlus2 size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
    </div>
  )
}
