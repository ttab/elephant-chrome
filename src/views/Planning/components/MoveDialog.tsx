import { useCollaboration } from '@/hooks/useCollaboration'
import { useRegistry } from '@/hooks/useRegistry'
import { useYValue } from '@/hooks/useYValue'
import { parseDate } from '@/lib/datetime'
import type { EleBlock } from '@/shared/types'
import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Switch } from '@ttab/elephant-ui'
import { toZonedTime } from 'date-fns-tz'
import { useMemo } from 'react'

export const MoveDialog = ({ onClose, newDate }: {
  onClose: () => void
  newDate: string
}) => {
  const { provider } = useCollaboration()
  const [assignments] = useYValue<EleBlock[]>('meta.core/assignment', false, provider)
  const [, setStartString] = useYValue<string>('meta.core/planning-item[0].data.start_date')
  const [, setEndString] = useYValue<string>('meta.core/planning-item[0].data.end_date')

  return (
    <Dialog open={true}>
      <DialogContent className='focus-visible:outline-none'>
        <DialogHeader>
          <DialogTitle>
            Flytta planering
          </DialogTitle>
          <DialogDescription>

            <div>
              Planeringen och alla dess uppdrag kommer flyttas till
              {' '}
              {newDate}
              .
              Avmarkera de uppdrag du eventuellt vill ska bibehålla sitt
              nuvarande datum.
            </div>

            <div className='flex flex-col border-t border-b gap-3 mt-5'>
              {(assignments || [])?.map((assignment, n) => {
                return (
                  <Assignment
                    key={assignment.id}
                    index={n}
                  />
                )
              })}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant='secondary'
            onClick={onClose}
          >
            Avbryt
          </Button>

          <Button
            autoFocus
            onClick={() => {
              setStartString(newDate)
              setEndString(newDate)
              onClose()
            }}
          >
            Flytta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Assignment({ index }: { index: number }) {
  const { provider } = useCollaboration()
  const { timeZone } = useRegistry()
  const date = useMemo(() => {
    return toZonedTime(`${newDate} 00:00:00`, timeZone)
  }, [timeZone, newDate])

  const base = `meta.core/assignment[${index}]`
  const [title] = useYValue<string>(`${base}.title`, false, provider)
  const [id] = useYValue<string>(`${base}.id`, false, provider)
  const [assignmentType] = useYValue<string>(`${base}.meta.core/assignment-type[0].value`, false, provider)
  const [publishTime] = useYValue<string>(`${base}.data.publish`, false, provider)
  const [startTime] = useYValue<string>(`${base}.data.start`, false, provider)
  const [endTime] = useYValue<string>(`${base}.data.end`, false, provider)
  const [publishSlot] = useYValue<string>(`${base}.data.publish_slot`, false, provider)
  const isDocument = assignmentType === 'flash' || assignmentType === 'text' || assignmentType === 'editorial-info'

  return (
    <Label className='grid gap-3 grid-cols-[auto_2rem] items-center border rounded-lg p-3 text-sm hover:bg-accent/50 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950'>
      <div>
        <div className='font-semibold mb-2'>{title}</div>
        <div>
          Från
          {' '}
          {startTime}
          {' '}
          till ...
          {' '}
        </div>
      </div>
      <div className='justify-self-end self-center'>
        <Checkbox
          defaultChecked
          onCheckedChange={() => { }}
        />
      </div>
    </Label>
  )
}
