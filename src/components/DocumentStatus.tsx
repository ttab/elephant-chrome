import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { useRef, useState, useEffect, type MouseEventHandler } from 'react'
import { useWorkflow } from '@/hooks/index/useWorkflow'
import { cn } from '@ttab/elephant-ui/utils'
import type { StatusSpecification, WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from './Prompt'
import type { Status } from '@/hooks/useDocumentStatus'

export const DocumentStatus = ({ type, status: currentStatus, setStatus }: {
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

  const defaultTransitionStatus = Object.keys(transitions).find((status) => transitions[status].default)
  const defaultTransition = defaultTransitionStatus
    ? transitions[defaultTransitionStatus]
    : Object.values(transitions)[0]

  const defaultStatusDef = defaultTransitionStatus ? statuses[defaultTransitionStatus] : undefined

  if (!defaultTransitionStatus || !Object.keys(transitions).length) {
    return null
  }

  return (
    <>
      <div className='flex items-center' ref={containerRef}>
        <DefaultActionButton
          onClick={() => showPrompt({
            status: defaultTransitionStatus,
            ...defaultTransition
          })}
          transition={defaultTransition}
          statusDef={defaultStatusDef}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size='sm' className='h-8 rounded-l-none px-2'>
              <ChevronDown size={16} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className='max-w-[340px] p-0 mt-1'
            align='end'
            sideOffset={0}
            style={{ minWidth: `${dropdownWidth}px` }}
          >
            <StatusOptions
              transitions={transitions}
              statuses={statuses}
              onSelect={showPrompt}
            />

            <StatusFooter
              icon={currentStatusDef?.icon}
              className={currentStatusDef?.className}
              title={workflow[currentStatusName]?.title}
              description={workflow[currentStatusName]?.description}
            />

          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {prompt && (
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
      )}
    </>
  )
}


const DefaultActionButton = ({ onClick, transition, statusDef }: {
  onClick: MouseEventHandler<HTMLButtonElement>
  transition: WorkflowTransition
  statusDef?: StatusSpecification
}) => (
  <Button
    size='sm'
    className='h-8 rounded-r-none border-r flex flex-row gap-2'
    onClick={onClick}
    title={transition?.description}
  >
    {!!statusDef?.icon && (
      <statusDef.icon
        size={18}
        strokeWidth={1.75}
        className={statusDef.className}
      />
    )}
    {transition?.title}
  </Button>
)


const StatusFooter = ({ icon: Icon, className, title, description }: {
  icon?: LucideIcon
  className: string
  title: string
  description: string
}) => (
  <div className='flex flex-row gap-4 p-4 py-6 bg-secondary text-secondary-foreground border-b'>
    <div className='w-4 grow-0 shrink-0 pt-0.5'>
      {!!Icon && (
        <Icon
          size={24}
          strokeWidth={1.75}
          className={cn(className, '-ms-0.5 -mt-0.5')}
        />
      )}
    </div>
    <div className='grow flex flex-col gap-0.5'>
      <div className='font-bold'>{title}</div>
      <div className='text-sm'>{description}</div>
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
            className='flex flex-row gap-4 w-full py-2 pe-2 items-start rounded-md'
            onClick={() => onSelect({ status, ...state })}
          >
            <div className='w-4 grow-0 shrink-0 pt-0.5'>
              {!!statusDef.icon && (
                <statusDef.icon
                  size={18}
                  strokeWidth={1.75}
                  className={statusDef.className}
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

