import { Button, Calendar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Label } from '@ttab/elephant-ui'
import { Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useWorkflow } from '@/hooks/index/useWorkflow'
import { cn } from '@ttab/elephant-ui/utils'
import type { StatusSpecification, WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from './Prompt'
import type { Status } from '@/hooks/useDocumentStatus'
import { TimeInput } from './TimeInput'
import { useRegistry } from '../hooks'

export const DocumentStatusMenu = ({ type, status: currentStatus, setStatus }: {
  type: string
  status?: Status
  setStatus: (status: string) => Promise<void>
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownWidth, setDropdownWidth] = useState<number>(0)
  const { statuses, workflow } = useWorkflow(type)
  const [prompt, showPrompt] = useState<{ status: string } & WorkflowTransition | undefined>()

  useEffect(() => {
    if (containerRef.current) {
      setDropdownWidth(containerRef.current.offsetWidth)
    }
  }, [])

  if (!currentStatus || !Object.keys(statuses).length) {
    return null
  }

  const currentStatusName = currentStatus.name
  const currentStatusDef = statuses[currentStatusName]
  const transitions = workflow[currentStatusName]?.transitions || {}

  if (!Object.keys(transitions).length) {
    return null
  }

  const CurrentIcon = currentStatusDef.icon

  return (
    <>
      <div className='flex items-center' ref={containerRef}>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='sm' variant='outline' className='flex items-center h-8 px-3' title={workflow[currentStatusName]?.description}>
              <div className='pe-2'>
                <CurrentIcon
                  size={18}
                  strokeWidth={1.75}
                  className={currentStatusDef?.className}
                />
              </div>
              <div className='pe-1'>
                {workflow[currentStatusName]?.title}
              </div>
              <div className='ps-1'>
                <ChevronDown size={16} />
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className='max-w-[340px] p-0 mt-1'
            align='end'
            sideOffset={0}
            style={{ minWidth: `${dropdownWidth}px` }}
          >
            <StatusHeader
              icon={currentStatusDef?.icon}
              className={currentStatusDef?.className}
              title={workflow[currentStatusName]?.title}
              description={workflow[currentStatusName]?.description}
            />

            <StatusOptions
              transitions={transitions}
              statuses={statuses}
              onSelect={showPrompt}
            />

          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {prompt && (
        <>
          {prompt.status === 'withheld' && (
            <SchedulePrompt
              prompt={prompt}
              showPrompt={showPrompt}
              setStatus={setStatus}
            />
          )}

          {prompt.status !== 'withheld' && (
            <DefaultPrompt
              prompt={prompt}
              showPrompt={showPrompt}
              setStatus={setStatus}
            />
          )}
        </>
      )}
    </>
  )
}


const StatusHeader = ({ icon: Icon, className, title, description }: {
  icon?: LucideIcon
  className: string
  title: string
  description: string
}) => (
  <div className='flex flex-row gap-5 p-4 py-4 border-t text-secondary-foreground border-b bg-gray-75 dark:bg-popover'>
    <div className='w-4 grow-0 shrink-0 pt-0.5'>
      {!!Icon && (
        <Icon
          size={24}
          strokeWidth={1.75}
          className={cn(className, '-mt-1')}
        />
      )}
    </div>
    <div className='grow flex flex-col gap-0.5 text-sm'>
      <div className='font-semibold'>{title}</div>
      <div className='text-sm'>{description}</div>
    </div>
    <div>
      <Check
        size={24}
        strokeWidth={2.25}
        className='mt-1'
      />
    </div>
  </div>
)


const StatusOptions = ({ transitions, statuses, onSelect }: {
  transitions: Record<string, WorkflowTransition>
  statuses: Record<string, StatusSpecification>
  onSelect: (state: { status: string } & WorkflowTransition) => void
}) => (
  <div className='p-2'>
    {Object.entries(transitions)
      .filter(([status]) => {
        // Filter out configured transitions not allowed from backend
        return !!(status === 'draft' || statuses[status])
      })
      .map(([status, state]) => {
        const statusDef = statuses[status]

        return (
          <DropdownMenuItem
            key={status}
            className='flex flex-row gap-5 w-full py-2 pe-2 items-start rounded-md'
            onClick={() => onSelect({ status, ...state })}
          >
            <div className='w-4 grow-0 shrink-0 pt-0.5'>
              {!!statusDef.icon && (
                <statusDef.icon
                  size={21}
                  strokeWidth={1.75}
                  className={cn(statusDef.className, '-mt-0.5')}
                />
              )}
            </div>

            <div className='grow flex flex-col gap-0.5'>
              <div className='font-semibold'>{state.title}</div>
              <div className='w-full text-sm text-muted-foreground pe-2'>
                {state.description}
              </div>
            </div>
          </DropdownMenuItem>
        )
      })}
  </div>
)

const DefaultPrompt = ({ prompt, setStatus, showPrompt }: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string) => Promise<void>
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
}) => {
  return (
    <Prompt
      title={prompt.title}
      description={prompt.description}
      primaryLabel={prompt.title}
      secondaryLabel='Avbryt'
      onPrimary={() => {
        showPrompt(undefined)
        void setStatus(prompt.status)
      }}
      onSecondary={() => {
        showPrompt(undefined)
      }}
    />
  )
}

const SchedulePrompt = ({ prompt, setStatus, showPrompt }: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string) => Promise<void>
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
        void setStatus(prompt.status)
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
                return dt < new Date()
              }}
            />
          </div>
        </div>
      </div>
    </Prompt>
  )
}

