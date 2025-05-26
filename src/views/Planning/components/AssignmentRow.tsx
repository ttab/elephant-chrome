import { AssignmentTimeDisplay } from '@/components/DataItem/AssignmentTimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type { DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { AlarmClockCheck, Clock1, Delete, Edit, Eye, FileInput, Library, type LucideProps, MoveRight, Pen, Watch } from '@ttab/elephant-ui/icons'
import { type MouseEvent, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import { useLink } from '@/hooks/useLink'
import { Prompt } from '@/components'
import { useCollaboration } from '@/hooks/useCollaboration'
import { Button } from '@ttab/elephant-ui'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { deleteByYPath, getValueByYPath } from '@/shared/yUtils'
import { useOpenDocuments } from '@/hooks/useOpenDocuments'
import { cn } from '@ttab/elephant-ui/utils'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'
import { CreateDeliverablePrompt } from './CreateDeliverablePrompt'
import { appendDocumentToAssignment } from '@/lib/createYItem'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { Move } from '@/components/Move/'
import { useModal } from '@/components/Modal/useModal'
import type * as Y from 'yjs'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import useSWRImmutable from 'swr/immutable'
import { getDeliverableType } from '@/defaults/templates/lib/getDeliverableType'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { CreatePrintArticle } from '@/components/CreatePrintArticle'
import { snapshot } from '@/lib/snapshot'
import { AssignmentVisibility } from '@/components/DataItem/AssignmentVisibility'
import { timeSlotTypes } from '@/defaults/assignmentTimeConstants'

export const AssignmentRow = ({ index, onSelect, isFocused = false, asDialog, onChange }: {
  index: number
  onSelect: () => void
  isFocused?: boolean
  asDialog?: boolean
  onChange?: (arg: boolean) => void
}): JSX.Element => {
  const { provider } = useCollaboration()
  const openArticle = useLink('Editor')
  const openFlash = useLink('Flash')

  const openDocuments = useOpenDocuments({ idOnly: true, name: 'Editor' })
  const { repository } = useRegistry()
  const { data: session } = useSession()

  const base = `meta.core/assignment[${index}]`
  const [assignment] = useYValue<Y.Map<unknown> | undefined>(base, true)
  const [inProgress] = useYValue(`${base}.__inProgress`)
  const [articleId] = useYValue<string>(`${base}.links.core/article[0].uuid`)
  const [flashId] = useYValue<string>(`${base}.links.core/flash[0].uuid`)

  const { data: articleStatus } = useSWRImmutable(['articlestatus', articleId, flashId], async () => {
    const id = articleId || flashId
    if ((id) && session?.accessToken) {
      return await repository?.getMeta({ uuid: id, accessToken: session.accessToken })
    }
  })

  const [editorialInfoId] = useYValue<string>(`${base}.links.core/editorial-info[0].uuid`)
  const [assignmentType] = useYValue<string>(`${base}.meta.core/assignment-type[0].value`)
  const [assignmentId] = useYValue<string>(`${base}.id`)
  const [title] = useYValue<string>(`${base}.title`)
  const [description] = useYValue<string>(`${base}.meta.core/description[0].data.text`)
  const [publishTime] = useYValue<string>(`${base}.data.publish`)
  const [startTime] = useYValue<string>(`${base}.data.start`)
  const [endTime] = useYValue<string>(`${base}.data.end`)
  const [publishSlot] = useYValue<string>(`${base}.data.publish_slot`)
  const [authors = []] = useYValue<Block[]>(`meta.core/assignment[${index}].links.core/author`)
  const [slugline] = useYValue<string>(`${base}.meta.tt/slugline[0].value`)

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false)
  const [showCreateDialogPayload, setShowCreateDialogPayload] = useState<boolean>(false)
  const yRoot = provider?.document.getMap('ele')
  const [planningId] = getValueByYPath<string | undefined>(yRoot, 'root.uuid')

  const documentId = articleId || flashId || editorialInfoId
  const isDocument = assignmentType === 'flash' || assignmentType === 'text' || assignmentType === 'editorial-info'
  const documentLabel = assignmentType
    ? AssignmentTypes.find((a) => a.value === assignmentType)?.label?.toLowerCase()
    : 'okänt'

  const openDocument = assignmentType === 'flash' ? openFlash : openArticle
  const { showModal, hideModal } = useModal()

  const assignmentTime = useMemo(() => {
    if (typeof assignmentType !== 'string') {
      return undefined
    }

    if (['picture', 'video'].includes(assignmentType) && startTime) {
      return {
        time: [new Date(startTime)],
        tooltip: 'Starttid'
      }
    }

    if (publishSlot) {
      const slotName = timeSlotTypes.find((slot) => slot.slots?.includes(publishSlot))?.label
      return {
        time: [slotName],
        tooltip: 'Publiceringsfönster'
      }
    }

    if (publishTime) {
      return {
        time: [new Date(publishTime)],
        tooltip: 'Publiceringstid'
      }
    }

    if (endTime && startTime && endTime !== startTime) {
      return {
        time: [new Date(startTime), new Date(endTime)],
        tooltip: 'Start- och sluttid'
      }
    }

    if (startTime) {
      return {
        time: [new Date(startTime)],
        tooltip: 'Starttid'
      }
    }
  }, [publishTime, assignmentType, startTime, endTime, publishSlot])

  const TimeIcon = useMemo(() => {
    const timeIcons: Record<string, React.FC<LucideProps>> = {
      start: Clock1,
      publish: AlarmClockCheck,
      'start-end': Watch
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
    } else {
      if (!asDialog && provider?.document) {
        setShowCreateDialogPayload(true)
      }
    }
  }, [documentId, provider?.document, openDocument, asDialog])

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

  const isUsable = articleStatus?.meta?.workflowState === 'usable'

  const menuItems: DotDropdownMenuActionItem[] = [
    {
      label: 'Öppna',
      disabled: !isDocument,
      icon: isUsable ? Eye : FileInput,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        const usable = articleStatus?.meta?.workflowState === 'usable'
        const version = articleStatus?.meta?.heads['usable']?.version

        onOpenEvent(event, usable && version ? { version } : undefined)
      }
    },
    {
      label: 'Redigera',
      icon: Edit,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        event.stopPropagation()
        event.preventDefault()
        onSelect()
      }
    },
    {
      label: 'Ta bort',
      disabled: isUsable,
      icon: Delete,
      item: () => {
        setShowVerifyDialog(true)
      }
    },
    {
      label: 'Flytta',
      disabled: isUsable,
      icon: MoveRight,
      item: () => {
        showModal(
          <Move
            asDialog
            onChange={onChange}
            onDialogClose={hideModal}
            original={{
              document: provider?.document,
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
      label: 'Skapa printartikel',
      disabled: !isDocument,
      icon: Library,
      item: () => {
        showModal(
          <CreatePrintArticle
            asDialog
            onDialogClose={hideModal}
            id={documentId}
          />
        )
      }
    }
  ]
  const selected = articleId && openDocuments.includes(articleId)
  return (
    <div
      ref={rowRef}
      tabIndex={0}
      className={cn(`
        flex
        flex-col
        gap-2
        text-sm
        px-6
        pt-2.5
        pb-4
        ring-inset
        hover:bg-muted
        focus:outline-none
        focus-visible:rounded-sm
        focus-visible:ring-2
        focus-visible:ring-table-selected
        `, selected ? 'bg-table-selected focus-visible:outline-table-selected' : ''
      )}
      onClick={(event) => {
        if (isDocument) {
          const isUsable = articleStatus?.meta?.workflowState === 'usable'
            || (assignmentType === 'flash' && articleStatus?.meta?.heads?.['usable']?.version === articleStatus?.meta?.currentVersion)
          const version = articleStatus?.meta?.heads?.['usable']?.version
          onOpenEvent(event, isUsable && version ? { version } : undefined)
        } else {
          onSelect()
        }
      }}
    >
      <div className='flex flex-row gap-6 items-center justify-items-between justify-between'>

        <div className='flex grow gap-2 items-center'>
          <AssignmentType
            path={`meta.core/assignment[${index}]`}
            editable={!documentId}
            readOnly
          />
          <AssigneeAvatars assignees={authors.map((author) => author.title)} />

          <div className='hidden items-center @3xl/view:flex'>
            <SluglineButton path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`} />
          </div>
        </div>

        <div className='flex grow items-center justify-end gap-1.5'>
          <div className='whitespace-nowrap flex items-center gap-1'>
            {assignmentTime && <AssignmentTimeDisplay date={assignmentTime} icon={TimeIcon} />}
          </div>

          <Button
            variant='ghost'
            size='sm'
            className='w-9 px-0 hover:bg-accent2'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onSelect()
            }}
          >
            <Pen size={18} strokeWidth={1.75} className='text-muted-foreground' />
          </Button>

          {!inProgress && <DotDropdownMenu items={menuItems} />}
        </div>
      </div>

      <div className='flex flex-row text-[15px] font-medium justify-between'>
        <span className='leading-relaxed group-hover/assrow:underline'>{title}</span>
        <AssignmentVisibility path={`meta.core/assignment[${index}].data.public`} editable={false} disabled={false} />
      </div>

      {
        !!description && (
          <div className='font-light pl-10'>
            {description}
          </div>
        )
      }

      <div className='flex flex-row @3xl/view:hidden'>
        <SluglineButton path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`} />
      </div>

      {showVerifyDialog && (
        <Prompt
          title='Ta bort?'
          description={`Vill du ta bort uppdraget${title ? ' ' + title : ''}?`}
          secondaryLabel='Avbryt'
          primaryLabel='Ta bort'
          onPrimary={(event) => {
            event.stopPropagation()
            setShowVerifyDialog(false)
            deleteByYPath(
              provider?.document.getMap('ele'),
              `meta.core/assignment[${index}]`
            )

            onChange?.(true)
          }}
          onSecondary={() => {
            setShowVerifyDialog(false)
          }}
        />
      )}

      {showCreateDialogPayload && !slugline && assignmentType !== 'flash' && (
        <Prompt
          title='Slugg saknas'
          description='Vänligen lägg till en slugg på uppdraget. Därefter kan du skapa en text.'
          primaryLabel='Ok'
          onPrimary={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setShowCreateDialogPayload(false)
          }}
        />
      )}

      {showCreateDialogPayload && provider?.document && (slugline || assignmentType === 'flash') && (
        <CreateDeliverablePrompt
          payload={createPayload(provider.document, index, assignmentType) || {}}
          deliverableType={getDeliverableType(assignmentType)}
          title={title || ''}
          documentLabel={documentLabel || ''}
          onClose={(id) => {
            if (id && provider?.document) {
              // Add document id to correct assignment
              appendDocumentToAssignment({
                document: provider.document,
                id,
                index,
                slug: '',
                type: getDeliverableType(assignmentType)
              })

              if (planningId) {
                void snapshot(planningId, undefined, 800).then(() => {
                  const openDocument = assignmentType === 'flash' ? openFlash : openArticle
                  openDocument(undefined, { id, planningId }, 'blank')
                })
              }
            }

            setShowCreateDialogPayload(false)
          }}
        />
      )}
    </div>
  )
}
