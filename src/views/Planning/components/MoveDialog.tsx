import { useRegistry } from '@/hooks/useRegistry'
import type { EleBlock } from '@/shared/types'
import { Button, Checkbox, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Tooltip } from '@ttab/elephant-ui'
import { dateToReadableDateTime } from '@/shared/datetime'
import { useEffect, useRef } from 'react'
import { dateToReadableDate, dateToReadableTime } from '@/shared/datetime'
import { getValueByYPath, setValueByYPath } from '@/shared/yUtils'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { format, toZonedTime } from 'date-fns-tz'
import { type TimeDef, useAssignmentTime } from '@/hooks/useAssignmentTime'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { toast } from 'sonner'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { type YDocument, useYPath, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { getValueFromPath } from '@/modules/yjs/lib/yjs'

export const MoveDialog = ({ ydoc, onClose, onChange, newDate }: {
  ydoc: YDocument<Y.Map<unknown>>
  onClose: () => void
  onChange: (value: boolean) => void
  newDate: string // YYYY-MM-DD in local time
}) => {
  const [id] = useYValue<string>(ydoc.ele, 'root.uuid')
  const [assignments] = useYValue<EleBlock[]>(ydoc.ele, 'meta.core/assignment', false)
  const [, setStartString] = useYValue<string>(ydoc.ele, 'meta.core/planning-item[0].data.start_date')
  const [, setEndString] = useYValue<string>(ydoc.ele, 'meta.core/planning-item[0].data.end_date')
  // Record of assignment ids and times to change
  const assignmentTimes = useRef<Record<string, TimeDef | undefined>>({})

  return (
    <Dialog open={true}>
      <DialogContent className='focus-visible:outline-none'>
        <DialogHeader>
          <DialogTitle>
            Byt datum på planering
          </DialogTitle>

          <DialogDescription>
            Planeringen och alla dess textuppdrag byter datum till
            {' '}
            {newDate}
            .
          </DialogDescription>

          <div className='flex flex-col gap-3 py-2 text-left'>
            {(assignments || []).map((_, n) => {
              const assignment = getValueFromPath<Y.Map<unknown>>(ydoc.ele, ['meta', 'core/assignment', n], true)
              const assignmentType = getValueFromPath<string>(assignment, ['meta', 'core/assignment-type', 0, 'value']) || ''

              if (assignment && !['picture', 'video'].includes(assignmentType)) {
                return (
                  <AssignmentListItem
                    key={assignment.get('id') as string}
                    ydoc={ydoc}
                    assignment={assignment}
                    newDate={newDate}
                    onChangeSelected={(id, value) => {
                      assignmentTimes.current[id] = value
                    }}
                  />
                )
              }
            })}
          </div>

          <DialogDescription>
            Välj nedan om även bild- och videouppdrag ska byta datum.
          </DialogDescription>

          <div className='flex flex-col gap-3 py-2 text-left'>
            {(assignments || []).map((_, n) => {
              const assignment = getValueFromPath<Y.Map<unknown>>(ydoc.ele, ['meta', 'core/assignment', n], true)
              const assignmentType = getValueFromPath<string>(assignment, ['meta', 'core/assignment-type', 0, 'value']) || ''

              if (assignment && ['picture', 'video'].includes(assignmentType)) {
                return (
                  <AssignmentCheckBox
                    key={assignment.get('id') as string}
                    ydoc={ydoc}
                    assignment={assignment}
                    newDate={newDate}
                    onChangeSelected={(id, value) => {
                      assignmentTimes.current[id] = value
                    }}
                  />
                )
              }
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
            disabled={!id}
            autoFocus
            onClick={() => {
              for (const aid in assignmentTimes.current) {
                if (!ydoc.provider?.document) {
                  return
                }

                const asgn = assignmentTimes.current?.[aid]
                if (!asgn) {
                  return
                }

                const assignments = getValueByYPath<Block[] | undefined>(ydoc.ele, 'meta.core/assignment')?.[0] || []
                const index = assignments.findIndex(
                  (assignment: Block) => assignment.id === aid
                )

                const zuluTime = (t: Date): string => {
                  return format(
                    toZonedTime(t, 'Z'),
                    'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
                  )
                }

                // Set the dates and times of the assignments
                const base = `meta.core/assignment[${index}]`
                setValueByYPath(ydoc.ele, `${base}.data.start_date`, newDate)
                setValueByYPath(ydoc.ele, `${base}.data.end_date`, newDate)

                if (asgn.name === 'start' && typeof asgn.newTime[0] !== 'string') {
                  setValueByYPath(ydoc.ele, `${base}.data.start`, zuluTime(asgn.newTime[0]))
                } else if (asgn.name === 'publish' && typeof asgn.newTime[0] !== 'string') {
                  setValueByYPath(ydoc.ele, `${base}.data.publish`, zuluTime(asgn.newTime[0]))
                } else if (asgn.name === 'range' && typeof asgn.newTime[0] !== 'string' && typeof asgn.newTime[1] !== 'string') {
                  setValueByYPath(ydoc.ele, `${base}.data.start`, zuluTime(asgn.newTime[0]))
                  setValueByYPath(ydoc.ele, `${base}.data.end`, zuluTime(asgn.newTime[1]))
                }
              }

              if (id) {
                // Set planning date and flush changes to repository
                setStartString(newDate)
                setEndString(newDate)

                snapshotDocument(id).then(() => {
                  onChange(true)
                  onClose()
                }).catch((err) => {
                  console.error(err)
                  toast.error('Planeringen har ändrats lokalt men gick inte att spara.')
                })
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

function AssignmentListItem({ ydoc, assignment, newDate, onChangeSelected }: {
  ydoc: YDocument<Y.Map<unknown>>
  assignment: Y.Map<unknown>
  newDate: string
  onChangeSelected: (id: string, value?: TimeDef) => void
}) {
  const path = useYPath(assignment, true)
  const [id] = useYValue<string>(assignment, 'id', false)
  const [title] = useYValue<string>(assignment, 'title', false)
  const assignmentTime = useAssignmentTime(assignment, newDate)

  useEffect(() => {
    // Default is to have the assignment selected to change, so callback immediately on load
    if (id) {
      onChangeSelected(id, assignmentTime)
    }
  }, [id, assignmentTime, onChangeSelected])

  return (
    <Label className='grid gap-3 grid-cols-[auto_2rem] items-center border rounded p-3 text-sm border-blue-600 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'>
      <div>
        <div className='font-semibold mb-2 flex items-center -m-2'>
          <AssignmentType
            ydoc={ydoc}
            path={path}
            editable={false}
            readOnly
          />
          {title}
        </div>

        {Array.isArray(assignmentTime?.time) && assignmentTime.icon && (
          <Tooltip content={assignmentTime.tooltip}>
            <div className='flex flex-row items-center justify-start gap-3'>
              <AssignmentTime assignmentTime={assignmentTime} />
            </div>
          </Tooltip>
        )}
      </div>
    </Label>
  )
}

function AssignmentCheckBox({ ydoc, assignment, newDate, onChangeSelected }: {
  ydoc: YDocument<Y.Map<unknown>>
  assignment: Y.Map<unknown>
  newDate: string
  onChangeSelected: (id: string, value?: TimeDef) => void
}) {
  const path = useYPath(assignment, true)
  const [id] = useYValue<string>(assignment, 'id')
  const [title] = useYValue<string>(assignment, 'title')
  const assignmentTime = useAssignmentTime(assignment, newDate)

  return (
    <Label htmlFor={id} className='grid gap-3 grid-cols-[auto_2rem] items-center border rounded p-3 text-sm hover:bg-accent/50 has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950'>
      <div>
        <div className='font-semibold mb-2 flex items-center -m-2'>
          <AssignmentType
            ydoc={ydoc}
            path={path}
            editable={false}
            readOnly
          />
          {title}
        </div>

        {Array.isArray(assignmentTime?.time) && assignmentTime.icon && (
          <Tooltip content={assignmentTime.tooltip}>
            <div className='flex flex-row items-center justify-start gap-3 has-aria-checked:opacity-50'>
              <AssignmentTime assignmentTime={assignmentTime} />
            </div>
          </Tooltip>
        )}
      </div>

      <div className='justify-self-end self-center'>
        <Checkbox
          id={id}
          disabled={assignmentTime?.name === 'slot'}
          defaultChecked={false}
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
            {dateToReadableDate(times[0], locale.code.full, timeZone)}
          </span>
          {' '}
          <span className='whitespace-nowrap'>
            {dateToReadableTime(times[0], locale.code.full, timeZone)}
            -
            {dateToReadableTime(times[1], locale.code.full, timeZone)}
          </span>
        </span>
      )
    }

    return null
  }

  return (
    <div className='flex flex-row items-start gap-2'>
      {!!assignmentTime.icon && <assignmentTime.icon size={18} />}

      {renderTimeRange(assignmentTime.time, true)}

      {assignmentTime.newTime && (
        <>
          <span className='text-muted-foreground px-1 pt-[2px] text-xs font-bold'>→</span>
          {renderTimeRange(assignmentTime.newTime)}
        </>
      )}
    </div>
  )
}
