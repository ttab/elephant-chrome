import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { ChevronDown } from '@ttab/elephant-ui/icons'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useWorkflow } from '@/hooks/index/useWorkflow'
import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { StatusOptions } from './StatusOptions'
import { StatusMenuHeader } from './StatusMenuHeader'
import { PromptDefault } from './PromptDefault'
import { PromptSchedule } from './PromptSchedule'

export const StatusMenu = ({ documentId, type, publishTime, onBeforeStatusChange }: {
  documentId: string
  type: string
  publishTime?: Date
  onBeforeStatusChange?: (
    status: string,
    data?: Record<string, unknown>
  ) => Promise<boolean>
}) => {
  const [documentStatus, setDocumentStatus] = useWorkflowStatus(documentId, (type === 'core/article' || type === 'tt/print-article'))
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownWidth, setDropdownWidth] = useState<number>(0)
  const { statuses, workflow } = useWorkflow(type)
  const [prompt, showPrompt] = useState<{ status: string } & WorkflowTransition | undefined>()

  useEffect(() => {
    if (containerRef.current) {
      setDropdownWidth(containerRef.current.offsetWidth)
    }
  }, [])

  // Callback function to set status. Will first call onBeforeStatusChange() if
  // provided by props, then proceed to change the status if allowed.
  const setStatus = useCallback(async (newStatus: string, data?: Record<string, unknown>) => {
    if (onBeforeStatusChange) {
      if (await onBeforeStatusChange(newStatus, data) !== true) {
        return
      }
    }

    await setDocumentStatus(
      newStatus,
      (typeof data?.cause === 'string') ? data.cause : undefined
    )
  }, [onBeforeStatusChange, setDocumentStatus])

  if (!documentStatus || !Object.keys(statuses).length) {
    return null
  }

  const currentStatusName = documentStatus.name
  const currentStatusDef = statuses[currentStatusName]
  const transitions = workflow[currentStatusName]?.transitions || {}

  // if (!Object.keys(transitions).length) {
  //   return null
  // }

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
            <StatusMenuHeader
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
            <PromptSchedule
              prompt={prompt}
              showPrompt={showPrompt}
              setStatus={(...args) => void setStatus(...args)}
              publishTime={publishTime}
              requireCause={!!documentStatus.checkpoint}
            />
          )}

          {prompt.status !== 'withheld' && (
            <PromptDefault
              prompt={prompt}
              showPrompt={showPrompt}
              setStatus={(...args) => void setStatus(...args)}
              currentCause={documentStatus?.cause as string}
              requireCause={prompt.status === 'draft' && !!documentStatus.checkpoint}
            />
          )}
        </>
      )}
    </>
  )
}

