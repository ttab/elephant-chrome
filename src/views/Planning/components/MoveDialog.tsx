import { useCollaboration } from '@/hooks/useCollaboration'
import { useRegistry } from '@/hooks/useRegistry'
import { useYValue } from '@/hooks/useYValue'
import type { EleBlock } from '@/shared/types'
import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Tooltip } from '@ttab/elephant-ui'
import { dateToReadableDateTime } from '@/lib/datetime'
import { useEffect, useRef } from 'react'
import { dateToReadableTime } from '@/shared/tmp/datetime'
import { getValueByYPath, setValueByYPath } from '@/shared/yUtils'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { format, toZonedTime } from 'date-fns-tz'
import { type TimeDef, useAssignmentTime } from '@/hooks/useAssignmentTime'

export const MoveDialog = ({ onClose, newDate }: {
  onClose: () => void
  newDate: string // YYYY-MM-DD in local time
}) => {
  const { provider } = useCollaboration()
  const [assignments] = useYValue<EleBlock[]>('meta.core/assignment', false, provider)
  const [, setStartString] = useYValue<string>('meta.core/planning-item[0].data.start_date')
  const [, setEndString] = useYValue<string>('meta.core/planning-item[0].data.end_date')

  // Record of assignment ids and times to change
  const assignmentTimes = useRef<Record<string, TimeDef | undefined>>({})

  return (
    <Dialog open={true}>
      <DialogContent className='focus-visible:outline-none'>
        <DialogHeader>
          <DialogTitle>
            Flytta planering
          </DialogTitle>

          <DialogDescription>
            Planeringen och alla dess uppdrag kommer flyttas till
            {' '}
            {newDate}
            .
            Avmarkera de uppdrag du eventuellt vill ska bibehålla sitt
            nuvarande datum.
          </DialogDescription>

          <div className='flex flex-col gap-3 py-2 text-left'>
            {(assignments || [])?.map((assignment, n) => {
              return (
                <Assignment
                  key={assignment.id}
                  index={n}
                  newDate={newDate}
                  onChangeSelected={(id, value) => {
                    assignmentTimes.current[id] = value
                  }}
                />
              )
            })}
          </div>
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
              for (const aid in assignmentTimes.current) {
                if (!provider?.document) {
                  return
                }

                const asgn = assignmentTimes.current?.[aid]
                if (!asgn) {
                  return
                }

                const yRoot = provider.document.getMap('ele')
                const assignments = getValueByYPath<Block[] | undefined>(yRoot, 'meta.core/assignment')?.[0] || []
                const index = assignments.findIndex(
                  (assignment: Block) => assignment.id === aid
                )

                const zuluTime = (t: Date): string => {
                  return format(
                    toZonedTime(t, 'Z'),
                    'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
                  )
                }

                // Set planning date
                setStartString(newDate)
                setEndString(newDate)


                // Set the dates and times of the assignments
                const base = `meta.core/assignment[${index}]`
                setValueByYPath(yRoot, `${base}.data.start_date`, newDate)
                setValueByYPath(yRoot, `${base}.data.end_date`, newDate)

                if (asgn.name === 'start' && typeof asgn.newTime[0] !== 'string') {
                  setValueByYPath(yRoot, `${base}.data.start`, zuluTime(asgn.newTime[0]))
                } else if (asgn.name === 'publish' && typeof asgn.newTime[0] !== 'string') {
                  setValueByYPath(yRoot, `${base}.data.publish`, zuluTime(asgn.newTime[0]))
                } else if (asgn.name === 'range' && typeof asgn.newTime[0] !== 'string' && typeof asgn.newTime[1] !== 'string') {
                  setValueByYPath(yRoot, `${base}.data.start`, zuluTime(asgn.newTime[0]))
                  setValueByYPath(yRoot, `${base}.data.end`, zuluTime(asgn.newTime[1]))
                }

                onClose()
              }
            }}
          >
            Flytta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Assignment({ index, newDate, onChangeSelected }: {
  index: number
  newDate: string
  onChangeSelected: (id: string, value?: TimeDef) => void
}) {
  const { provider } = useCollaboration()
  const base = `meta.core/assignment[${index}]`
  const [id] = useYValue<string>(`${base}.id`, false, provider)
  const [title] = useYValue<string>(`${base}.title`, false, provider)
  const assignmentTime = useAssignmentTime(index, newDate)

  useEffect(() => {
    // Default is to have the assignment selected to change, so callback immediately on load
    if (id) {
      onChangeSelected(id, assignmentTime)
    }
  }, [id, assignmentTime, onChangeSelected])

  return (
    <Label className='grid gap-3 grid-cols-[auto_2rem] items-center border rounded p-3 text-sm hover:bg-accent/50 has-[[aria-checked=true]]:border-blue-600 has-[[aria-checked=true]]:bg-blue-50 dark:has-[[aria-checked=true]]:border-blue-900 dark:has-[[aria-checked=true]]:bg-blue-950'>
      <div>
        <div className='font-semibold mb-2'>{title}</div>

        {Array.isArray(assignmentTime?.time) && assignmentTime.icon && (
          <Tooltip content={assignmentTime.tooltip}>
            <div className='flex flex-row items-center justify-start gap-3'>
              <AssignmentTime assignmentTime={assignmentTime} />
            </div>
          </Tooltip>
        )}
      </div>

      <div className='justify-self-end self-center'>
        <Checkbox
          disabled={assignmentTime?.name === 'slot'}
          defaultChecked
          onCheckedChange={(checked) => {
            if (id) {
              onChangeSelected(id, checked === true ? assignmentTime : undefined)
            }
          }}
        />
      </div>
    </Label>
  )
}

/**
 * Display one assignment time with it's new time.
 */
function AssignmentTime({ assignmentTime }: { assignmentTime: TimeDef }) {
  const { timeZone, locale } = useRegistry()

  const renderTimeRange = (times: Array<string | Date>, original: boolean = false) => {
    if (typeof times?.[0] === 'string') {
      return (
        <span className={original ? 'text-muted-foreground' : ''}>{times[0]}</span>
      )
    }

    if (times.length === 1 && typeof times[0] !== 'string') {
      return (
        <span className={original ? 'text-muted-foreground' : ''}>
          {dateToReadableDateTime(times[0], locale.code.full, timeZone)}
        </span>
      )
    }

    if (times.length === 2 && typeof times[0] !== 'string' && typeof times[1] !== 'string') {
      return (
        <span className={original ? 'text-muted-foreground' : ''}>
          <span className='whitespace-nowrap'>
            {dateToReadableDateTime(times[0], locale.code.full, timeZone)}
          </span>
          -
          <span className='whitespace-nowrap'>
            {dateToReadableTime(times[1], locale.code.full, timeZone)}
          </span>
        </span>
      )
    }

    return null
  }

  return (
    <div className='flex flex-row items-center gap-2'>
      {!!assignmentTime.icon && <assignmentTime.icon size={18} />}

      {renderTimeRange(assignmentTime.time, true)}

      {assignmentTime.newTime && (
        <>
          <span className='text-muted-foreground px-1 text-xs font-bold'>→</span>
          {renderTimeRange(assignmentTime.newTime)}
        </>
      )}
    </div>
  )
}
