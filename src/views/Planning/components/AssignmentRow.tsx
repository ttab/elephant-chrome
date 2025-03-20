import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Delete, Edit, FileInput, Pen } from '@ttab/elephant-ui/icons'
import { type MouseEvent, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import { useLink } from '@/hooks/useLink'
import { Prompt } from '@/components'
import { appendDocumentToAssignment } from '@/lib/createYItem'
import { useCollaboration } from '@/hooks/useCollaboration'
import { Button } from '@ttab/elephant-ui'
import { type Block } from '@ttab/elephant-api/newsdoc'
import { deleteByYPath } from '@/lib/yUtils'
import { useOpenDocuments } from '@/hooks/useOpenDocuments'
import { cn } from '@ttab/elephant-ui/utils'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'


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

  const base = `meta.core/assignment[${index}]`
  const [inProgress] = useYValue(`${base}.__inProgress`)
  const [articleId] = useYValue<string>(`${base}.links.core/article[0].uuid`)
  const [flashId] = useYValue<string>(`${base}.links.core/flash[0].uuid`)
  const [assignmentType] = useYValue<string>(`${base}.meta.core/assignment-type[0].value`)
  const [title] = useYValue<string>(`${base}.title`)
  const [description] = useYValue<string>(`${base}.meta.core/description[0].data.text`)
  const [publishTime] = useYValue<string>(`${base}.data.publish`)
  const [startTime] = useYValue<string>(`${base}.data.start`)
  const [authors = []] = useYValue<Block[]>(`meta.core/assignment[${index}].links.core/author`)

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false)
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false)

  const documentId = articleId || flashId
  const isDocument = assignmentType === 'flash' || assignmentType === 'text'
  const documentLabel = assignmentType === 'text' ? 'artikel' : assignmentType
  const openDocument = assignmentType === 'text' ? openArticle : openFlash

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

  const onOpenEvent = useCallback(<T extends HTMLElement>(event: MouseEvent<T> | KeyboardEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (documentId) {
      openDocument(event, {
        id: documentId,
        autoFocus: false
      }, undefined,
      undefined,
      event instanceof KeyboardEvent && event.key === ' ')
    } else {
      if (!asDialog) {
        setShowCreateDialog(true)
      }
    }
  }, [documentId, openDocument, setShowCreateDialog, asDialog])

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


  const menuItems = [
    {
      label: 'Redigera',
      icon: Edit,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        event.preventDefault()
        event.stopPropagation()
        onSelect()
      }
    },
    {
      label: 'Ta bort',
      icon: Delete,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        event.preventDefault()
        event.stopPropagation()
        setShowVerifyDialog(true)
      }
    }
  ]

  if ((isDocument) && !asDialog) {
    menuItems.push({
      label: 'Öppna',
      icon: FileInput,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        onOpenEvent(event)
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
          onOpenEvent(event)
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

      {
        showVerifyDialog && (
          <Prompt
            title='Ta bort?'
            description={`Vill du ta bort uppdraget${title ? ' ' + title : ''}?`}
            secondaryLabel='Avbryt'
            primaryLabel='Ta bort'
            onPrimary={() => {
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
        )
      }

      {
        showCreateDialog && (
          <Prompt
            title={`Skapa ${documentLabel}?`}
            description={`Vill du skapa en ${documentLabel} för uppdraget${title ? ' ' + title : ''}?`} // TODO: Display information that will be forwarded from the assignment
            secondaryLabel='Avbryt'
            primaryLabel='Skapa'
            onPrimary={(event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => {
              event.preventDefault()
              event.stopPropagation()

              setShowCreateDialog(false)
              if (!provider?.document) {
                return
              }

              const id = crypto.randomUUID()
              const onDocumentCreated = (): void => {
                setTimeout(() => {
                  appendDocumentToAssignment({
                    document: provider?.document,
                    id,
                    index,
                    slug: '',
                    type: assignmentType === 'flash'
                      ? 'flash'
                      : 'article'
                  })
                }, 0)
              }

              const payload = createPayload(provider?.document, index)

              openDocument(event,
                { id, payload },
                'blank',
                { onDocumentCreated }
              )
            }}
            onSecondary={(event) => {
              event.preventDefault()
              event.stopPropagation()

              setShowCreateDialog(false)
            }}
          />
        )
      }
    </div>
  )
}
