import { useLink } from '@/hooks/useLink'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { CalendarDaysIcon, FileInput } from '@ttab/elephant-ui/icons'

export const ToastAction = ({ planningId, flashId }: {
  planningId?: string
  flashId?: string
}): JSX.Element => {
  const openFlash = useLink('Flash')
  const openPlanning = useLink('Planning')
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
    </div>
  )
}
