import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import type { DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Delete, Edit, Eye, FileInput, MoveRight, Pen } from '@ttab/elephant-ui/icons'
import { type MouseEvent, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import { useLink } from '@/hooks/useLink'
import { Prompt } from '@/components'
import { useCollaboration } from '@/hooks/useCollaboration'
import { Button } from '@ttab/elephant-ui'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { deleteByYPath, getValueByYPath } from '@/lib/yUtils'
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
import { snapshot } from '@/lib/snapshot'

export const AssignmentRow = ({ index, onSelect, isFocused = false, asDialog }: {
  index: number
  onSelect: () => void
  isFocused?: boolean
  asDialog?: boolean
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

  const { data: articleStatus } = useSWRImmutable(['articlestatus', articleId], async () => {
    if (articleId && session?.accessToken) {
      return await repository?.getMeta({ uuid: articleId, accessToken: session.accessToken })
    }
  })

  const [flashId] = useYValue<string>(`${base}.links.core/flash[0].uuid`)
  const [editorialInfoId] = useYValue<string>(`${base}.links.core/editorial-info[0].uuid`)
  const [assignmentType] = useYValue<string>(`${base}.meta.core/assignment-type[0].value`)
  const [assignmentId] = useYValue<string>(`${base}.id`)
  const [title] = useYValue<string>(`${base}.title`)
  const [description] = useYValue<string>(`${base}.meta.core/description[0].data.text`)
  const [publishTime] = useYValue<string>(`${base}.data.publish`)
  const [startTime] = useYValue<string>(`${base}.data.start`)
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

  const assTime = useMemo(() => {
    if (typeof assignmentType !== 'string') {
      return undefined
    }
    const startTimeTypes = ['picture', 'picture/video', 'video']
    return startTimeTypes.includes(assignmentType) && startTime
      ? new Date(startTime)
      : publishTime
        ? new Date(publishTime)
        : undefined
  }, [publishTime, assignmentType, startTime])

  // Open a deliverable (e.g. article, flash, editorial-info) callback helper.
  const onOpenEvent = useCallback(<T extends HTMLElement>(event: MouseEvent<T> | KeyboardEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (documentId) {
      openDocument(
        event,
        {
          id: documentId,
          autoFocus: false
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
    }
  ]

  if ((isDocument) && !asDialog) {
    menuItems.push({
      label: 'Öppna',
      disabled: false,
      icon: isUsable ? Eye : FileInput,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        if (articleStatus?.meta?.workflowState === 'usable') {
          const openDocument = assignmentType === 'flash' ? openFlash : openArticle
          openDocument(event, {
            id: articleId },
          'last',
          undefined,
          undefined,
          {
            version: articleStatus?.meta.heads['usable'].version
          })
        } else {
          onOpenEvent(event)
        }
      }
    })
  }

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
          if (articleStatus?.meta?.workflowState === 'usable') {
            const openDocument = assignmentType === 'flash' ? openFlash : openArticle
            openDocument(event, { id: articleId }, 'last', undefined, undefined, { version: articleStatus?.meta.heads['usable'].version })
          } else {
            onOpenEvent(event)
          }
        } else {
          onSelect()
        }
      }}
    >
      <div className='flex flex-row gap-6 items-center justify-items-between justify-between'>

        <div className='flex grow gap-2 items-center'>
          <AssignmentType
            path={`meta.core/assignment[${index}].meta.core/assignment-type`}
            editable={!documentId}
            readOnly
          />
          <AssigneeAvatars assignees={authors.map((author) => author.title)} />

          <div className='hidden items-center @3xl/view:flex'>
            <SluglineButton path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`} />
          </div>
        </div>

        <div className='flex grow items-center justify-end gap-1.5'>
          <div className='min-w-[64px] whitespace-nowrap'>
            {assTime ? <TimeDisplay date={assTime} /> : ''}
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

      <div className='text-[15px] font-medium'>
        <span className='leading-relaxed group-hover/assrow:underline'>{title}</span>
      </div>

      {
        !!description && (
          <div className='font-light pl-10'>
            {description}
          </div>
        )
      }

      <div className='@3xl/view:hidden'>
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
                void snapshot(planningId).then(() => {
                  const openDocument = assignmentType === 'flash' ? openFlash : openArticle
                  openDocument(undefined, { id }, 'blank')
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
