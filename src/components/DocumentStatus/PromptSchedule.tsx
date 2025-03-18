import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useRegistry } from '@/hooks/useRegistry'
import { useState } from 'react'
import { Calendar, Label } from '@ttab/elephant-ui'
import { TimeInput } from '../TimeInput'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

export const PromptSchedule = ({ prompt, setStatus, showPrompt }: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
}) => {
  const { timeZone } = useRegistry()

  // FIXME: Should default to what is in the assignment (as props)
  const initialTime = new Date()
  const todaysDate = Number(initialTime.toLocaleDateString().replaceAll('-', ''))

  const [date, setDate] = useState(initialTime)
  const [time, setTime] = useState((initialTime))


  return (
    <Prompt
      title={prompt.title}
      primaryLabel={prompt.title}
      secondaryLabel='Avbryt'
      onPrimary={() => {
        showPrompt(undefined)
        void setStatus(
          prompt.status,
          {
            time: new Date()
          }
        )
      }}
      onSecondary={() => {
        showPrompt(undefined)
      }}
    >
      <div className='flex flex-col items-start gap-6'>
        {prompt.description}

        <div className='flex flex-row justify-items-start items-stretch gap-6 flex-wrap pt-2'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='ScheduledTime'>Ange tid</Label>

            <TimeInput
              id='ScheduledTime'
              defaultTime={format(toZonedTime(time, timeZone), 'HH:mm')}
              handleOnChange={(value) => {
                if (value) {
                  const [hour, mins] = value.split(':').map(Number)
                  const t = new Date(time)
                  t.setHours(hour)
                  t.setMinutes(mins)
                  setTime(t)
                }
              }}
              handleOnSelect={() => { }}
              setOpen={() => { }}
              className='border w-auto'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='ScheduledDate'>Ange datum</Label>

            <Calendar
              id='ScheduledDate'
              mode='single'
              required={true}
              className='border rounded w-auto'
              autoFocus
              selected={date}
              weekStartsOn={1}
              timeZone={timeZone}
              onSelect={(dt) => {
                setDate(dt)
                const t = new Date(dt)
                t.setHours(time.getHours())
                t.setMinutes(time.getMinutes())
                t.setSeconds(time.getSeconds())
                setDate(dt)
                setTime(t)
              }}
              disabled={(dt) => {
                return Number(dt.toLocaleDateString().replaceAll('-', '')) < todaysDate
              }}
            />
          </div>
        </div>
      </div>
    </Prompt>
  )
}
