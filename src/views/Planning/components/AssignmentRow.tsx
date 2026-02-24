import { AssignmentTimeDisplay } from '@/components/DataItem/AssignmentTimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type { DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import {
  AlarmClockCheckIcon,
  Clock1Icon,
  ClockFadingIcon,
  DeleteIcon,
  EditIcon,
  EyeIcon,
  FileInputIcon,
  LibraryIcon,
  MoveRightIcon,
  PenIcon,
  type LucideProps
} from '@ttab/elephant-ui/icons'
import { type MouseEvent, useMemo, useState, useCallback, useEffect, useRef, type JSX } from 'react'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useLink } from '@/hooks/useLink'
import { Prompt } from '@/components'
import { Button } from '@ttab/elephant-ui'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { deleteByYPath, getValueByYPath } from '@/shared/yUtils'
import { useOpenDocuments } from '@/hooks/useOpenDocuments'
import { cn } from '@ttab/elephant-ui/utils'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { CreateDeliverablePrompt } from './CreateDeliverablePrompt'
import { appendDocumentToAssignment } from '@/shared/createYItem'
import { createPayload } from '@/shared/templates/lib/createPayload'
import { Move } from '@/components/Move/'
import { useModal } from '@/components/Modal/useModal'
import type * as Y from 'yjs'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { getDeliverableType } from '@/shared/templates/lib/getDeliverableType'
import { isVisualAssignmentType } from '@/defaults/assignmentTypes'
import { CreatePrintArticle } from '@/components/CreatePrintArticle'
import { snapshotDocument } from '@/lib/snapshotDocument'
import { timeSlotTypes } from '@/defaults/assignmentTimeConstants'
import useSWR from 'swr'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import { toast } from 'sonner'
import { AssignmentStatus } from './AssignmentStatus'
import { useTranslation } from 'react-i18next'

export const AssignmentRow = ({ ydoc, index, onSelect, isFocused = false, asDialog }: {
  ydoc: YDocument<Y.Map<unknown>>
  index: number
  onSelect?: () => void
  isFocused?: boolean
  asDialog?: boolean
}): JSX.Element => {
  const openArticle = useLink('Editor')
  const openFlash = useLink('Flash')

  const openDocuments = useOpenDocuments({ idOnly: true, name: 'Editor' })
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { t } = useTranslation()

  const base = `meta.core/assignment[${index}]`
  const [assignment] = useYValue<Y.Map<unknown>>(ydoc.ele, base, true)
  const [inProgress] = useYValue(assignment, '__inProgress')
  const [articleId] = useYValue<string>(assignment, 'links.core/article[0].uuid')
  const [flashId] = useYValue<string>(assignment, 'links.core/flash[0].uuid')

  const { data: articleStatus, mutate } = useSWR(['articlestatus', articleId, flashId], async () => {
    const id = articleId || flashId

    if ((id) && session?.accessToken) {
      return await repository?.getMeta({ uuid: id, accessToken: session.accessToken })
    }
  })

  const [editorialInfoId] = useYValue<string>(assignment, 'links.core/editorial-info[0].uuid')
  const [assignmentType] = useYValue<string>(assignment, 'meta.core/assignment-type[0].value')
  const [assignmentId] = useYValue<string>(assignment, 'id')
  const [title] = useYValue<string>(assignment, 'title')
  const [description] = useYValue<string>(assignment, 'meta.core/description[0].data.text')
  const [publishTime] = useYValue<string>(assignment, 'data.publish')
  const [startTime] = useYValue<string>(assignment, 'data.start')
  const [endTime] = useYValue<string>(assignment, 'data.end')
  const [publishSlot] = useYValue<string>(assignment, 'data.publish_slot')
  const [authors = []] = useYValue<Block[]>(assignment, 'links.core/author')
  const [slugline] = useYValue<string>(assignment, 'meta.tt/slugline[0].value')

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false)
  const [showCreateDialogPayload, setShowCreateDialogPayload] = useState<boolean>(false)
  const [isLinking, setIsLinking] = useState<boolean>(false)
  const [planningId] = getValueByYPath<string | undefined>(ydoc.ele, 'root.uuid')

  const documentId = articleId || flashId || editorialInfoId
  const isDocument = assignmentType === 'flash' || assignmentType === 'text' || assignmentType === 'editorial-info'
  const documentLabel = assignmentType
    ? t(`shared:assignmentTypes.${assignmentType}`)
    : t('common:misc.unknown')

  const openDocument = assignmentType === 'flash' ? openFlash : openArticle
  const { showModal, hideModal } = useModal()

  const assignmentTime = useMemo(() => {
    if (typeof assignmentType !== 'string') {
      return undefined
    }
    const endAndStartAreNotEqual = endTime && startTime && endTime !== startTime

    if (isVisualAssignmentType(assignmentType) && startTime) {
      if (endAndStartAreNotEqual) {
        return {
          time: [new Date(startTime), new Date(endTime)],
          tooltip: t('planning:assignment.startEndTime'),
          type: assignmentType
        }
      }

      return {
        time: [new Date(startTime)],
        tooltip: t('planning:assignment.startTime'),
        type: assignmentType
      }
    }

    if (publishSlot) {
      const slotName = timeSlotTypes.find((slot) => slot.slots?.includes(publishSlot))?.label
      return {
        time: [slotName],
        tooltip: t('planning:assignment.publishWindow'),
        type: assignmentType
      }
    }

    if (publishTime) {
      return {
        time: [new Date(publishTime)],
        tooltip: t('planning:assignment.publishTime'),
        type: assignmentType
      }
    }

    if (endAndStartAreNotEqual) {
      return {
        time: [new Date(startTime), new Date(endTime)],
        tooltip: t('planning:assignment.startEndTime'),
        type: assignmentType
      }
    }

    if (startTime) {
      return {
        time: [new Date(startTime)],
        tooltip: t('planning:assignment.startTime'),
        type: assignmentType
      }
    }
  }, [publishTime, assignmentType, startTime, endTime, publishSlot, t])

  const TimeIcon = useMemo(() => {
    const timeIcons: Record<string, React.FC<LucideProps>> = {
      start: Clock1Icon,
      publish: AlarmClockCheckIcon,
      'start-end': ClockFadingIcon
    }

    const type = publishTime ? 'publish' : endTime && startTime && endTime !== startTime ? 'start-end' : 'start'

    return timeIcons[type] || <></>
  }, [publishTime, endTime, startTime])

  // Open a deliverable (e.g. article, flash, editorial-info) callback helper.
  // For readOnly pass version object
  const onOpenEvent = useCallback(<T extends HTMLElement>(event: MouseEvent<T> | KeyboardEvent, readOnly?: { version: bigint }) => {
    event.preventDefault()
    event.stopPropagation()

    if (documentId) {
      openDocument(
        event,
        {
          id: documentId,
          autoFocus: false,
          version: readOnly?.version.toString()
        },
        undefined,
        undefined,
        event instanceof KeyboardEvent && event.key === ' ')
    } else if (!asDialog && ydoc.ele) {
      // No deliverable yet, show create dialog
      setShowCreateDialogPayload(true)
    }
  }, [documentId, ydoc.ele, openDocument, asDialog])

  const rowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (rowRef?.current && isFocused) {
      rowRef.current.focus()
    }
  })

  useNavigationKeys({
    elementRef: rowRef,
    keys: ['Enter', ' '],
    onNavigation: (event) => {
      if (isDocument) {
        if (event.key === 'Enter' || event.key === ' ') {
          onOpenEvent(event)
        }
      }
    }
  })

  const isUsable = articleStatus?.meta?.workflowCheckpoint === 'usable'

  const menuItems: DotDropdownMenuActionItem[] = [
    {
      label: t('common:actions.open'),
      disabled: !isDocument,
      icon: isUsable ? EyeIcon : FileInputIcon,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        const usable = articleStatus?.meta?.workflowState === 'usable'
        const version = articleStatus?.meta?.heads['usable']?.version

        onOpenEvent(event, usable && version ? { version } : undefined)
      }
    },
    {
      label: t('common:actions.edit'),
      icon: EditIcon,
      disabled: !onSelect,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        event.stopPropagation()
        event.preventDefault()
        if (onSelect) {
          onSelect()
        }
      }
    },
    {
      label: t('common:actions.remove'),
      disabled: isUsable,
      icon: DeleteIcon,
      item: () => {
        setShowVerifyDialog(true)
      }
    },
    {
      label: t('common:actions.move'),
      icon: MoveRightIcon,
      item: () => {
        showModal(
          <Move
            ydoc={ydoc}
            asDialog
            onDialogClose={hideModal}
            original={{
              document: ydoc.provider?.document,
              assignmentId,
              assignmentTitle: title,
              assignment,
              planningId
            }}
          />
        )
      }
    },
    {
      label: t('planning:assignment.createPrintArticle'),
      disabled: !isDocument,
      icon: LibraryIcon,
      item: () => {
        showModal(
          <CreatePrintArticle
            id={documentId}
            asDialog
            onDialogClose={hideModal}
          />
        )
      }
    }
  ]
  const selected = articleId && openDocuments.includes(articleId)
  const workflowState = articleStatus?.meta?.workflowState

  useRepositoryEvents([
    'core/article',
    'core/flash',
    'core/editorial-info'
  ], (event) => {
    if (event.event === 'status' && event.uuid === documentId) {
      void mutate()
    }
  })

  return (
    <div
      ref={rowRef}
      tabIndex={0}
      className={cn(`
        flex
        flex-col
        gap-2
        text-sm
        px-4
        pt-4
        pb-4
        ring-inset
        hover:bg-muted
        dark:hover:bg-table-focused
        transition-all
        focus:outline-none
        focus-visible:rounded-sm
        focus-visible:ring-2
        focus-visible:ring-table-selected
        `, selected ? 'bg-table-selected focus-visible:outline-table-selected' : ''
      )}
      onClick={(event) => {
        if (showCreateDialogPayload || isLinking) {
          return
        }

        if (isDocument) {
          const isUsable = articleStatus?.meta?.workflowState === 'usable'
            || (assignmentType === 'flash' && articleStatus?.meta?.heads?.['usable']?.version === articleStatus?.meta?.currentVersion)
          const version = articleStatus?.meta?.heads?.['usable']?.version
          onOpenEvent(event, isUsable && version ? { version } : undefined)
        } else if (onSelect) {
          onSelect()
        }
      }}
    >
      <div className='flex flex-row gap-6 items-center justify-items-between justify-between'>

        <div className='flex grow gap-2 items-center'>
          <AssignmentType
            assignment={assignment}
            editable={!documentId}
            readOnly
          />
          <AssigneeAvatars assignees={authors.map((author) => author.title)} />

          <div className='hidden items-center @3xl/view:flex'>
            <SluglineButton value={slugline} />
          </div>
        </div>

        <div className='flex grow items-center justify-end gap-1.5'>
          <div className='whitespace-nowrap flex items-center gap-1'>
            {assignmentTime && <AssignmentTimeDisplay date={assignmentTime} icon={TimeIcon} />}
          </div>

          <Button
            disabled={!onSelect}
            variant='ghost'
            size='sm'
            className='w-9 px-0 hover:bg-accent2 hover:bg-gray-200 dark:hover:bg-table-focused'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (onSelect) {
                onSelect()
              }
            }}
          >
            <PenIcon size={18} strokeWidth={1.75} className='text-muted-foreground' />
          </Button>

          {!inProgress && <DotDropdownMenu items={menuItems} />}
        </div>
      </div>

      <div className='flex flex-row text-[15px] font-medium justify-between pr-2'>
        <div className='flex items-center gap-2 px-2'>
          <AssignmentStatus
            isVisualAssignment={isVisualAssignmentType(assignmentType)}
            ydoc={ydoc}
            path={`meta.core/assignment[${index}].data.status`}
            workflowState={workflowState}
          />
          <span className='leading-relaxed group-hover/assrow:underline'>{title}</span>
        </div>
        <div className='flex items-center gap-2'>
          {/* FIXME: Disable until we have an idea of how this should be clear to end-user
          <AssignmentVisibility
            ydoc={ydoc}
            path={`meta.core/assignment[${index}].data.public`}
            editable={false}
            disabled={false}
          /> */}
        </div>
      </div>

      {
        !!description && (
          <div className='flex gap-2'>
            <div style={{ minWidth: 18, height: 18 }} className='pl-2' />
            <div className='font-light px-2'>
              {description}
            </div>
          </div>
        )
      }

      <div className='flex flex-row @3xl/view:hidden'>
        <SluglineButton value={slugline} />
      </div>

      {showVerifyDialog && (
        <Prompt
          title={`${t('common:actions.remove') as unknown as string}?`}
          description={`${t('planning:assignment.removeAssignment') as unknown as string}${title ? ' ' + title : ''}?`}
          secondaryLabel={t('common:actions.abort')}
          primaryLabel={t('common:actions.remove')}
          onPrimary={(event) => {
            event.stopPropagation()
            setShowVerifyDialog(false)
            deleteByYPath(ydoc.ele, `meta.core/assignment[${index}]`)
          }}
          onSecondary={() => {
            setShowVerifyDialog(false)
          }}
        />
      )}

      {showCreateDialogPayload && !slugline && assignmentType !== 'flash' && (
        <Prompt
          title={t('planning:prompts.slugMissing')}
          description={t('planning:prompts.slugMissingDescription')}
          primaryLabel='Ok'
          onPrimary={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setShowCreateDialogPayload(false)
          }}
        />
      )}

      {showCreateDialogPayload && ydoc.provider?.document && (slugline || assignmentType === 'flash') && (
        <CreateDeliverablePrompt
          ydoc={ydoc}
          payload={createPayload(ydoc.provider.document, index, assignmentType) || {}}
          deliverableType={getDeliverableType(assignmentType)}
          title={title || ''}
          documentLabel={documentLabel || ''}
          onClose={(id) => {
            // Prevent multiple simultaneous linking attempts
            if (isLinking) {
              return
            }

            // Capture document reference early to prevent race conditions
            const document = ydoc.provider?.document

            if (!id) {
              setShowCreateDialogPayload(false)
              return
            }

            if (!document) {
              console.error('AssignmentRow: Document reference lost after deliverable creation', { id })
              toast.error(t('errors:toasts.createDeliverableLinkError'))
              setShowCreateDialogPayload(false)
              return
            }

            setIsLinking(true)

            // Link deliverable to assignment with error handling
            try {
              appendDocumentToAssignment({
                document,
                id,
                index,
                slug: '',
                type: getDeliverableType(assignmentType)
              })
            } catch (ex: unknown) {
              const errorMessage = ex instanceof Error ? ex.message : t('errors:messages.unknown') as unknown as string
              const linkError = t('errors:toasts.createDeliverableLinkError') as unknown as string

              console.error('AssignmentRow: Failed to link deliverable to assignment', {
                id,
                assignmentIndex: index,
                error: errorMessage
              })
              toast.error(`${linkError}: ${errorMessage}`)
              setShowCreateDialogPayload(false)
              setIsLinking(false)
              return
            }

            // Snapshot document with error handling
            if (planningId) {
              snapshotDocument(planningId, undefined, document).then(() => {
                const openDocument = assignmentType === 'flash' ? openFlash : openArticle
                openDocument(undefined, { id, planningId }, 'blank')
                setIsLinking(false)
              }).catch((ex: unknown) => {
                const errorMessage = ex instanceof Error ? ex.message : t('errors:toasts.saveError')
                console.error('AssignmentRow: Failed to snapshot planning document', {
                  planningId,
                  deliverableId: id,
                  error: errorMessage
                })
                toast.error(errorMessage)
                setIsLinking(false)
              })
            } else {
              setIsLinking(false)
            }

            setShowCreateDialogPayload(false)
          }}
        />
      )}
    </div>
  )
}
