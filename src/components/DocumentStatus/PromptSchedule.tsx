import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useRegistry } from '@/hooks/useRegistry'
import { useState } from 'react'
import { Label } from '@ttab/elephant-ui'
import { TimeInput } from '../TimeInput'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'
import { CalendarIcon } from '@ttab/elephant-ui/icons'
import { PromptCauseField } from './PromptCauseField'
import { useTranslation } from 'react-i18next'

export const PromptSchedule = ({ publishTime, prompt, setStatus, showPrompt, requireCause = false }: {
  publishTime?: Date
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
  requireCause?: boolean
}) => {
  const { timeZone } = useRegistry()
  const initialTime = publishTime ? new Date(publishTime) : new Date()
  const [time, setTime] = useState((initialTime))
  const [cause, setCause] = useState<string | undefined>()
  const { t } = useTranslation()

  return (
    <Prompt
      title={prompt.title}
      primaryLabel={prompt.title}
      secondaryLabel={t('common:actions.abort')}
      onPrimary={() => {
        showPrompt(undefined)
        void setStatus(
          prompt.status,
          {
            time,
            cause
          }
        )
      }}
      onSecondary={() => {
        showPrompt(undefined)
      }}
      disablePrimary={requireCause && !cause}
    >
      <div className='flex flex-col items-start gap-6'>
        {prompt.description}

        <div className='flex flex-row justify-items-start items-stretch gap-6 flex-wrap pt-2'>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='ScheduledTime'>{t('shared:status_menu.setTime')}</Label>

            <TimeInput
              id='ScheduledTime'
              autoFocus={true}
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
            <Label htmlFor='ScheduledTime'>{t('shared:status_menu.planningDate')}</Label>
            <span className='border py-2 px-3 h-8 text-sm rounded flex flex-row gap-4 items-center justify-between bg-muted'>
              {format(toZonedTime(time, timeZone), 'yyyy-MM-dd')}
              <CalendarIcon size={14} strokeWidth={1.75} />
            </span>
          </div>

          {requireCause && (
            <div className='flex flex-col gap-2'>
              <PromptCauseField onValueChange={setCause} />
            </div>
          )}

        </div>
      </div>
    </Prompt>
  )
}
