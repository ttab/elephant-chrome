import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@ttab/elephant-ui'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useWorkflow } from '@/hooks/index/useWorkflow'
import { StatusSpecifications, type WorkflowTransition } from '@/defaults/workflowSpecification'
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
import { reset } from '@/views/Concepts/lib/reset'
import { isConceptType } from '@/shared/isConceptType'
import { tableDataMap } from '@/views/Concepts/lib/conceptDataTable'

export const StatusMenu = ({ ydoc, type, publishTime, onBeforeStatusChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  type: string
  publishTime?: Date
  onBeforeStatusChange?: (
    status: string,
    data?: Record<string, unknown>
  ) => Promise<boolean>
}) => {
  // Should read the workflow status to get correct status
  const shouldUseWorkflowStatus = [
    'core/article',
    'core/flash',
    'core/editorial-info',
    'tt/print-article'
  ].includes(type) || isConceptType(type)

  const [documentStatus, setDocumentStatus] = useWorkflowStatus({ ydoc, documentId: ydoc.id, isWorkflow: shouldUseWorkflowStatus, asPrint: type === 'tt/print-article', documentType: type })
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownWidth, setDropdownWidth] = useState<number>(0)
  const { statuses, workflow } = useWorkflow(type)
  const [prompt, showPrompt] = useState<{ status: string } & WorkflowTransition | undefined>()
  const { data: session } = useSession()
  const { repository } = useRegistry()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId } = useView()

  // TODO: Revisit once reworking changed status logic for plannings etc
  let isChanged: boolean
  if (type === 'tt/print-article' && documentStatus?.name === 'usable') {
    isChanged = ydoc.isChanged
  } else {
    isChanged = shouldUseWorkflowStatus && !isConceptType(type) ? false : ydoc.isChanged
  }

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

    const WORKFLOW_TYPES = new Set([
      'core/article',
      'core/planning-item',
      'core/event'
    ])
    try {
      (async () => {
        await repository?.saveMeta({
          status,
          accessToken: session?.accessToken || '',
          cause: documentStatus?.cause,
          isWorkflow: WORKFLOW_TYPES.has(type) || isConceptType(type),
          currentStatus: documentStatus
        })

        const ConceptViews = Object.fromEntries(Object.keys(tableDataMap).map((key) => [key, 'Concept']))
        const viewType: Record<string, View> = {
          'core/article': 'Editor',
          'core/planning-item': 'Planning',
          'core/event': 'Event',
          'tt/print-article': 'PrintEditor',
          ...ConceptViews
        }

        handleLink({
          dispatch,
          viewItem: state.viewRegistry.get(viewType[type]),
          props: { id: ydoc.id, documentType: type },
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

  const resetDocument = async () => {
    if (!ydoc.id || !session?.accessToken || !repository) return
    await reset(repository, ydoc.id, session.accessToken)
    ydoc.setIsChanged(false)
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

  const getCurrentCause = (
    cause: string | undefined,
    type: string,
    isChanged: boolean,
    prompt: { status: string } & WorkflowTransition | undefined
  ): string | undefined => {
    if (cause !== undefined) {
      return cause
    } else if (type === 'tt/print-article') {
      return ''
    } else if (isChanged && prompt?.status === 'usable') {
      return ''
    } else {
      return undefined
    }
  }
  // For print-articles we show "unpublished changes" _only_ if checkpoint is 'usable'
  const asSave = !!(type === 'tt/print-article'
    ? isChanged && documentStatus.checkpoint === 'usable'
    : isChanged && documentStatus.name !== 'draft'
  )
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
              asSave={asSave}
            >
              {asSave && (
                <>
                  <StatusMenuOption
                    key='save'
                    status={documentStatus.name}
                    state={{
                      verify: true,
                      title: `Uppdatera ändringar - ${workflow[currentStatusName]?.title}`,
                      description: 'Uppdatera med ändringar'
                    }}
                    onSelect={showPrompt}
                    statusDef={currentStatusDef}
                  />
                  {isConceptType(type)
                    && (
                      <StatusMenuOption
                        key='reset'
                        status={documentStatus.name}
                        state={{
                          verify: true,
                          title: `Återställ`,
                          description: 'Återställ till senast använda version'
                        }}
                        onSelect={() => showPrompt({
                          verify: true,
                          title: 'Återställ',
                          description: 'Återställ till senast använda version',
                          status: 'reset' })}
                        statusDef={currentStatusDef}
                      />
                    )}
                </>
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
              currentCause={
                getCurrentCause(documentStatus?.cause, type, isChanged, prompt)
              }
              requireCause={!!documentStatus.checkpoint && [
                'core/article',
                'core/flash',
                'core/editorial-info'
              ].includes(type)}
              unPublishDocument={unPublishDocument}
              resetDocument={resetDocument}
            />
          )}
        </>
      )}
    </>
  )
}
