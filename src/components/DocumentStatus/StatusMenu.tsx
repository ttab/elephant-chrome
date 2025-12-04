import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useWorkflow } from '@/hooks/index/useWorkflow'
import { StatusSpecifications, WorkflowSpecifications, type WorkflowTransition } from '@/defaults/workflowSpecification'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'
import { StatusOptions } from './StatusOptions'
import { StatusMenuHeader } from './StatusMenuHeader'
import { PromptDefault } from './PromptDefault'
import { PromptSchedule } from './PromptSchedule'
import { StatusMenuOption } from './StatusMenuOption'
import { StatusButton } from './StatusButton'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { toast } from 'sonner'
import { handleLink } from '../Link/lib/handleLink'
import { useHistory, useNavigation, useView } from '@/hooks/index'
import type { View } from '@/types/index'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const StatusMenu = ({ ydoc, publishTime, onBeforeStatusChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  publishTime?: Date
  onBeforeStatusChange?: (
    status: string,
    data?: Record<string, unknown>
  ) => Promise<boolean>
}) => {
  const [documentStatus, setDocumentStatus] = useWorkflowStatus({ ydoc })
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownWidth, setDropdownWidth] = useState<number>(0)
  const { statuses, workflow } = useWorkflow(documentStatus?.type)
  const [prompt, showPrompt] = useState<{ status: string } & WorkflowTransition | undefined>()
  const { data: session } = useSession()
  const { repository } = useRegistry()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId } = useView()

  // Read workflow specifications from current type and current status
  const isWorkflow = documentStatus?.type
    ? WorkflowSpecifications[documentStatus.type][documentStatus.name].isWorkflow
    : false
  const isChanged = !isWorkflow ? ydoc.isChanged : false
  const asSave = (documentStatus?.type
    ? WorkflowSpecifications[documentStatus.type][documentStatus.name].asSave && ydoc.isChanged
    : false) || false
  const requireCause = !!documentStatus?.checkpoint && documentStatus.type
    ? WorkflowSpecifications[documentStatus.type][documentStatus.name].requireCause || false
    : false


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

  const unPublishDocument = (newStatus?: string) => {
    if (!repository || !session?.accessToken || newStatus !== 'unpublished') {
      return
    }

    // Unpublishing a document is done by setting version: -1, status name to 'usable'
    const status = {
      uuid: ydoc.id,
      name: 'usable',
      version: -1n
    }

    try {
      (async () => {
        await repository?.saveMeta({
          status,
          accessToken: session?.accessToken || '',
          cause: documentStatus?.cause,
          isWorkflow: documentStatus?.type === 'core/article',
          currentStatus: documentStatus
        })

        const viewType: Record<string, View> = {
          'core/article': 'Editor',
          'core/planning-item': 'Planning',
          'core/event': 'Event',
          'tt/print-article': 'PrintEditor'
        }
        handleLink({
          dispatch,
          viewItem: state.viewRegistry.get(viewType[documentStatus?.type || 'Error']),
          props: { id: ydoc.id },
          viewId: crypto.randomUUID(),
          history,
          origin: viewId,
          target: 'self'
        })
      })().catch((err) => console.error(err))
    } catch (error) {
      toast.error('Det gick inte att avpublicera dokumentet')
      console.error('error while unpublishing document:', error)
    }
  }

  if (!documentStatus || !Object.keys(statuses).length) {
    return null
  }

  const currentStatusName = documentStatus.name
  const currentStatusDef = statuses[currentStatusName] || StatusSpecifications[currentStatusName]
  const transitions = workflow[currentStatusName]?.transitions || {}

  if (!Object.keys(transitions).length && currentStatusName !== 'unpublished') {
    return null
  }

  return (
    <>
      <div className='flex items-center' ref={containerRef}>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <StatusButton
              documentStatus={documentStatus}
              workflow={workflow}
              currentStatusName={currentStatusName}
              currentStatusDef={currentStatusDef}
              asSave={asSave}
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className='max-w-[340px] p-0 mt-1'
            align='end'
            sideOffset={0}
            style={{ minWidth: `${dropdownWidth}px` }}
          >
            <StatusMenuHeader
              icon={currentStatusDef?.icon || StatusSpecifications[currentStatusName]?.icon}
              className={currentStatusDef?.className || StatusSpecifications[currentStatusName]?.className}
              title={workflow[currentStatusName]?.title}
              description={workflow[currentStatusName]?.description}
            />
            <StatusOptions
              transitions={transitions}
              statuses={statuses}
              onSelect={showPrompt}
            >
              {asSave && isChanged && (
                <StatusMenuOption
                  key='save'
                  status={documentStatus.name}
                  state={{
                    verify: false,
                    isWorkflow: false,
                    title: `Uppdatera ändringar - ${workflow[currentStatusName]?.title}`,
                    description: 'Uppdatera med ändringar'
                  }}
                  onSelect={currentStatusName === 'usable' ? showPrompt : () => setStatus('usable')}
                  statusDef={currentStatusDef}
                />

              )}
            </StatusOptions>

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
              currentCause={documentStatus.cause}
              requireCause={requireCause}
              unPublishDocument={unPublishDocument}
            />
          )}
        </>
      )}
    </>
  )
}
