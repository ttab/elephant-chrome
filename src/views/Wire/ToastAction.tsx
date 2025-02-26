import { useLink } from '@/hooks/useLink'
import { Button, Tooltip } from '@ttab/elephant-ui'
import { CalendarDaysIcon, FileInput } from '@ttab/elephant-ui/icons'

export const ToastAction = ({ planningId, wireId }: {
  planningId?: string
  wireId?: string
}): JSX.Element => {
  const openArticle = useLink('Editor')
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
      {wireId && (
        <Tooltip
          content='Öppna artikel'
        >
          <Button
            variant='icon'
            onClick={(event) => openArticle(event, { id: wireId })}
          >
            <FileInput size={16} strokeWidth={1.75} />
          </Button>
        </Tooltip>
      )}
    </div>
  )
}
