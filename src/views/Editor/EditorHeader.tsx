import { useHistory, useLink, useNavigation, useView, useWorkflowStatus } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, type JSX } from 'react'
import { MetaSheet } from '@/components/MetaSheet/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from '@/components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { CableIcon } from '@ttab/elephant-ui/icons'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { toast } from 'sonner'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { Button } from '@ttab/elephant-ui'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'
import useSWR from 'swr'
import type { EleDocument, EleDocumentResponse } from '@/shared/types'
import { HastToggle } from '@/components/HastToggle'

const BASE_URL = import.meta.env.BASE_URL || ''

const wireDocFetcher = async (url: string): Promise<EleDocument | undefined> => {
  const response = await fetch(url)
  if (!response.ok) return undefined
  const result = await response.json() as EleDocumentResponse
  return result.document
}

export const EditorHeader = ({ ydoc, readOnly, readOnlyVersion, planningId: propPlanningId }: {
  ydoc: YDocument<Y.Map<unknown>>
  planningId?: string | null
  readOnly?: boolean
  readOnlyVersion?: bigint
}): JSX.Element => {
  const { viewId } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const planningId = useDeliverableInfo(ydoc.id)?.planningUuid ?? ''
  const [workflowStatus] = useWorkflowStatus({ ydoc, documentId: ydoc.id })
  const { t } = useTranslation('shared')
  const documentType = workflowStatus?.type

  const openLatestVersion = useLink('Editor')
  const openSources = useLink('Sources')
  const [wireBlocks] = useYValue<Block[]>(ydoc.ele, 'links.tt/wire')

  // Fetch embargo from the original wire document (schema doesn't allow
  // storing embargo_until on the article's wire link data)
  const primaryWireId = wireBlocks?.[0]?.uuid
  const { data: wireDocument } = useSWR<EleDocument | undefined>(
    primaryWireId ? `${BASE_URL}/api/documents/${primaryWireId}?direct=true` : null,
    wireDocFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )
  const embargoUntil = wireDocument?.meta?.['tt/wire']?.[0]?.data?.embargo_until

  // FIXME: We must have a way to retrieve the publish time defined in the planning.
  // FIXME: When yjs opening of related planning have been fixed this should be readded/remade.
  // This code relies on having the planning assignment publish time available to be able
  // set the correct suggested publish time when scheduling an article for publish.
  // Without this code it will always suggest "now()".
  //
  // useEffect(() => {
  //   if (deliverablePlanning) {
  //     const { index } = deliverablePlanning.getAssignment()
  //     const [ass] = getValueByYPath<EleBlock>(deliverablePlanning.yRoot, `meta.core/assignment[${index}]`)

  //     if (ass) {
  //       setPublishTime((prev) => (ass.data.publish !== prev) ? ass.data.publish : prev)
  //     }
  //   }
  // }, [deliverablePlanning])

  // Callback to set correct withheld time to the assignment
  const onBeforeStatusChange = useCallback(async (newStatus: string, data?: Record<string, unknown>) => {
    // Prevent direct publish if embargo is still active
    if (newStatus === 'usable' && embargoUntil) {
      const embargoDate = new Date(embargoUntil)
      if (embargoDate > new Date()) {
        toast.error(t('editor:embargoActive', {
          time: embargoDate.toLocaleString()
        }))
        return false
      }
    }

    if (newStatus === 'draft') {
      handleLink({
        dispatch,
        viewItem: state.viewRegistry.get('Editor'),
        props: { id: ydoc.id },
        viewId: crypto.randomUUID(),
        history,
        origin: viewId,
        target: 'self'
      })
    }

    // When we set withheld or draft we must change related dates (publish and start respecively)
    if (['withheld', 'draft'].includes(newStatus)) {
      // We require a valid publish time if scheduling
      if (newStatus === 'withheld' && !(data?.time instanceof Date)) {
        toast.error(t('errors:toasts.couldNotScheduleArticle'))
        return false
      }

      const newTime = ((data?.time instanceof Date))
        ? data.time
        : new Date()

      await updateAssignmentTime(ydoc.id, planningId, newStatus, newTime, t)
    }

    return true
  }, [planningId, dispatch, ydoc.id, history, state.viewRegistry, viewId, t, embargoUntil])

  const isReadOnlyAndUpdated = workflowStatus && workflowStatus?.name !== 'usable' && readOnly
  const isUnpublished = workflowStatus?.name === 'unpublished'

  return (
    <ViewHeader.Root>
      <ViewHeader.Title
        name='Editor'
        preview={readOnly && !readOnlyVersion}
        title={documentTypeValueFormat?.[documentType || 'core/article']?.label}
        icon={(() => {
          const fmt = documentTypeValueFormat?.[documentType || 'core/article']
          return (readOnly && fmt?.readonly?.icon) || fmt?.icon
        })()}
        ydoc={!readOnly ? ydoc : undefined}
      />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[810px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @md/view:flex'>
              {!readOnly && <AddNote ydoc={ydoc} />}
              {!readOnly && documentType !== 'core/editorial-info'
                && <Newsvalue ydoc={ydoc} path='meta.core/newsvalue[0].value' />}
              {!readOnly && documentType === 'core/article' && (
                <HastToggle ydoc={ydoc} usableId={workflowStatus?.usableId} />
              )}
              {!!wireBlocks?.length && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='gap-1.5 text-muted-foreground'
                  onClick={(event) => openSources(event, { id: ydoc.id }, 'last')}
                >
                  <CableIcon size={15} strokeWidth={1.75} />
                  {t('wires:sources.title')}
                </Button>
              )}
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!ydoc.id && (
              <>
                {!readOnly && <ViewHeader.RemoteUsers ydoc={ydoc} />}

                {isReadOnlyAndUpdated && !isUnpublished && readOnlyVersion && (
                  <Button
                    variant='secondary'
                    onClick={(event) => {
                      openLatestVersion(
                        event,
                        { id: ydoc.id },
                        'self'
                      )
                    }}
                  >
                    {t('editor:goToLatestVersion')}
                  </Button>
                )}

                {!!(propPlanningId || planningId) && (!isReadOnlyAndUpdated || isUnpublished) && (
                  <StatusMenu
                    planningId={propPlanningId || planningId}
                    ydoc={ydoc}
                    onBeforeStatusChange={onBeforeStatusChange}
                    embargoUntil={embargoUntil}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action>
        <MetaSheet ydoc={ydoc} readOnly={readOnly} readOnlyVersion={readOnlyVersion} />
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
