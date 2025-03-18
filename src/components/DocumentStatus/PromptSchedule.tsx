import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useRegistry } from '@/hooks/useRegistry'
import { useState } from 'react'
import { Calendar, Label } from '@ttab/elephant-ui'
import { TimeInput } from '../TimeInput'


export const PromptSchedule = ({ prompt, setStatus, showPrompt }: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
}) => {
  const now = new Date()
  const { locale, timeZone } = useRegistry()

  // FIXME: Should default to what is in the assignment (as props)
  const [date, setDate] = useState(now)
  const [time, setTime] = useState((now).toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  }))

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
              defaultTime={time}
              handleOnChange={(value) => {
                console.log(value)
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
              onSelect={(value) => {
                console.log(value)
              }}
              disabled={(dt) => {
                return dt <= new Date()
              }}
            />
          </div>
        </div>
      </div>
    </Prompt>
  )
}
