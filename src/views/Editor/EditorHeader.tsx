import {
  useDocumentSnapshot,
  useHistory,
  useLink,
  useNavigation,
  useRegistry,
  useView,
  useWorkflowStatus
} from '@/hooks'
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
import { useSession } from 'next-auth/react'
import { Button } from '@ttab/elephant-ui'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'
import { HastToggle } from '@/components/HastToggle'
import { HastIndicator } from '@/components/HastIndicator'

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
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { t } = useTranslation('shared')
  const documentType = workflowStatus?.type

  const openLatestVersion = useLink('Editor')
  const openSources = useLink('Sources')
  const [wireBlocks] = useYValue<Block[]>(ydoc.ele, 'links.tt/wire')

  // Fetch embargo from the original wire document (schema doesn't allow
  // storing embargo_until on the article's wire link data)
  const primaryWireId = wireBlocks?.[0]?.uuid
  const { data: wireDocument, error: wireError } = useDocumentSnapshot({ id: primaryWireId, direct: true })
  const embargoUntil = wireDocument?.meta?.['tt/wire']?.[0]?.data?.embargo_until
  const wireUnverified = !!primaryWireId && !!wireError

  // Read-only has no Y.Map; fall back to the fetched document for the category.
  const isTimeless = documentType === 'core/article#timeless'
  const [yjsTimelessCategory] = useYValue<Block[]>(ydoc.ele, 'links.core/timeless-category')
  const { data: articleDocument } = useDocumentSnapshot({
    id: ydoc.id,
    version: readOnlyVersion,
    enabled: readOnly && isTimeless
  })
  const timelessCategory = yjsTimelessCategory?.[0]?.title
    ?? articleDocument?.links?.['core/timeless-category']?.[0]?.title

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
    // Block publish if the embargo couldn't be verified (fail-closed).
    if (newStatus === 'usable' && wireUnverified) {
      toast.error(t('editor:embargoCheckUnavailable'))
      return false
    }

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

    // Transitioning from a used/readonly state needs a direct status write,
    // since the default snapshotDocument path expects a live Yjs session
    // which we don't have in the readonly editor.
    const isUsedToDraft = workflowStatus?.name === 'used' && newStatus === 'draft'

    if (isUsedToDraft) {
      if (!repository || !session?.accessToken || !workflowStatus?.version) {
        toast.error(t('errors:toasts.couldNotChangeStatus'))
        return false
      }

      try {
        await repository.saveMeta({
          status: {
            uuid: ydoc.id,
            name: 'draft',
            version: workflowStatus.version
          },
          accessToken: session.accessToken,
          isWorkflow: true,
          currentStatus: workflowStatus
        })
      } catch (err) {
        console.error('Failed to reopen as draft:', err)
        toast.error(t('errors:toasts.couldNotChangeStatus'))
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

      // saveMeta already applied the status change; skip default setDocumentStatus.
      if (isUsedToDraft) {
        return false
      }
    }

    // When we set withheld or draft we must change related dates on the planning
    // assignment (publish and start respectively). Skip when no planning is associated —
    // the transition still succeeds, but no assignment times are touched.
    if (['withheld', 'draft'].includes(newStatus) && planningId) {
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
  }, [planningId, dispatch, ydoc.id, history, state.viewRegistry, viewId, t, repository, session?.accessToken, workflowStatus, embargoUntil, wireUnverified])

  const isReadOnlyAndUpdated = workflowStatus && workflowStatus?.name !== 'usable' && readOnly
  const isUnpublished = workflowStatus?.name === 'unpublished'
  const isUsed = workflowStatus?.name === 'used'

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
        titleClassName='hidden @4xl/view:block'
      />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[810px] mx-auto flex flex-row gap-1 @xl/view:gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
            <div className='hidden flex-row gap-1 @xl/view:gap-2 justify-start items-center @md/view:flex'>
              {!readOnly && <AddNote ydoc={ydoc} />}
              {!readOnly && documentType !== 'core/editorial-info'
                && <Newsvalue ydoc={ydoc} path='meta.core/newsvalue[0].value' />}
              {!readOnly && documentType === 'core/article' && (
                <HastToggle
                  ydoc={ydoc}
                  usableId={workflowStatus?.usableId}
                  labelClassName='hidden @3xl/view:inline'
                />
              )}
              {readOnly && <HastIndicator documentId={ydoc.id} size={18} />}
              {isTimeless && timelessCategory && (
                <span className='hidden @3xl/view:inline text-sm font-medium text-muted-foreground truncate'>
                  {timelessCategory}
                </span>
              )}
              {!!wireBlocks?.length && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='hidden @xl/view:inline-flex gap-1.5 text-muted-foreground px-2'
                  onClick={(event) => openSources(event, { id: ydoc.id }, 'last')}
                  title={t('wires:sources.title')}
                >
                  <CableIcon size={15} strokeWidth={1.75} />
                  <span className='hidden @3xl/view:inline'>{t('wires:sources.title')}</span>
                </Button>
              )}
            </div>
          </div>

          <div className='flex flex-row gap-1 @xl/view:gap-2 justify-end items-center'>
            {!!ydoc.id && (
              <>
                {!readOnly && <ViewHeader.RemoteUsers ydoc={ydoc} />}

                {isReadOnlyAndUpdated && !isUnpublished && !isUsed && readOnlyVersion && (
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={(event) => {
                      openLatestVersion(
                        event,
                        { id: ydoc.id },
                        'self'
                      )
                    }}
                    title={t('editor:goToLatestVersion')}
                  >
                    <span className='hidden @2xl/view:inline'>{t('editor:goToLatestVersion')}</span>
                    <span className='@2xl/view:hidden'>{t('editor:goToLatestVersionShort')}</span>
                  </Button>
                )}

                {(!isReadOnlyAndUpdated || isUnpublished || isUsed) && (
                  <StatusMenu
                    planningId={propPlanningId || planningId || undefined}
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
