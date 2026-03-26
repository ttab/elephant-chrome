import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useRegistry } from '@/hooks/useRegistry'
import { useEffect, useState } from 'react'
import { Label } from '@ttab/elephant-ui'
import { TimeInput } from '../TimeInput'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'
import { CalendarIcon } from '@ttab/elephant-ui/icons'
import { PromptCauseField } from './PromptCauseField'
import { useCollaborationDocument } from '@/hooks/useCollaborationDocument'
import { useYValue } from '@/modules/yjs/hooks'
import { LoaderIcon } from 'lucide-react'

export const PromptSchedule = ({ prompt, planningId, setStatus, showPrompt, requireCause = false }: {
  prompt: {
    status: string
  } & WorkflowTransition
  planningId: string
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
  requireCause?: boolean
}) => {
  const { timeZone } = useRegistry()
  const { loading, document } = useCollaborationDocument({ documentId: planningId })
  const ele = document ? document.getMap('ele') : undefined
  const [publishDate] = useYValue<Date>(ele, 'meta.core/planning-item[0].data.start_date') as Date[]
  const now = new Date()
  const [time, setTime] = useState(now)
  const [cause, setCause] = useState<string | undefined>()

  useEffect(() => {
    // Don't set time until we have loaded the planning document and can read the publish date
    if (!planningId) {
      setTime(now)
      return
    }
    if (loading) return

    if (publishDate) {
      const d = new Date(publishDate)
      d.setHours(now.getHours(), now.getMinutes(), 0, 0)
      setTime(d)
    }
    // should only run when loading changes
    // eslint-disable-next-line
  }, [loading])

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
            <Label htmlFor='ScheduledTime'>Ange tid</Label>

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
            <Label htmlFor='ScheduledTime'>Datum i planeringen</Label>
            {loading && planningId
              ? (
                  <LoaderIcon size={14} strokeWidth={1.75} className='animate-spin mx-auto' />
                )
              : (
                  <span className='border py-2 px-3 h-8 text-sm rounded flex flex-row gap-4 items-center justify-between bg-muted'>
                    {format(toZonedTime(time, timeZone), 'yyyy-MM-dd')}
                    <CalendarIcon size={14} strokeWidth={1.75} />
                  </span>
                )}
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
