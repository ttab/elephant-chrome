import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Delete, Edit, FileInput, Pen } from '@ttab/elephant-ui/icons'
import { type MouseEvent, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import { useLink } from '@/hooks/useLink'
import { Prompt } from './Prompt'
import { appendArticle } from '@/lib/createYItem'
import { useCollaboration } from '@/hooks/useCollaboration'
import { Button } from '@ttab/elephant-ui'
import { type Block } from '@ttab/elephant-api/newsdoc'
import { deleteByYPath } from '@/lib/yUtils'
import { createArticlePayload } from '@/defaults/templates/articleDocumentTemplate'
import { useOpenDocuments } from '@/hooks/useOpenDocuments'
import { cn } from '@ttab/elephant-ui/utils'
import { useNavigationKeys } from '@/hooks/useNavigationKeys'

// export const AssignmentRow = ({ index, onSelect, isFocused }: {
//   index: number
//   onSelect: () => void
//   isFocused?: boolean
// }): JSX.Element => {

//   return (
//     <div>
//       <AssignmentRowContent
//         index={index}
//         onSelect={onSelect}
//         isFocused={isFocused}
//       />
//     </div>
//   )
// }

export const AssignmentRow = ({ index, onSelect, isFocused = false }: {
  index: number
  onSelect: () => void
  isFocused?: boolean
}): JSX.Element => {
  const { provider } = useCollaboration()
  const openArticle = useLink('Editor')
  const openDocuments = useOpenDocuments({ idOnly: true, name: 'Editor' })

  const base = `meta.core/assignment[${index}]`
  const [inProgress] = useYValue(`${base}.__inProgress`)
  const [articleId] = useYValue<string>(`${base}.links.core/article[0].uuid`)
  const [assignmentType] = useYValue<string>(`${base}.meta.core/assignment-type[0].value`)
  const [title] = useYValue<string>(`${base}.title`)
  const [description] = useYValue<string>(`${base}.meta.core/description[0].data.text`)
  const [publishTime] = useYValue<string>(`${base}.data.publish`)
  const [authors = []] = useYValue<Block[]>(`meta.core/assignment[${index}].links.core/author`)

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false)
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false)

  const assTime = useMemo(() => {
    return publishTime ? new Date(publishTime) : undefined
  }, [publishTime])

  const onOpenArticleEvent = useCallback(<T extends HTMLElement>(event: MouseEvent<T> | KeyboardEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (articleId) {
      openArticle(event, {
        id: articleId
      })
    } else {
      setShowCreateDialog(true)
    }
  }, [articleId, openArticle, setShowCreateDialog])

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
      if (assignmentType === 'text' || assignmentType === 'flash') {
        if (event.key === 'Enter') {
          onOpenArticleEvent(event)
        } else if (event.key === ' ') {
          onSelect()
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

  if (assignmentType === 'text' || assignmentType === 'flash') {
    menuItems.push({
      label: 'Öppna artikel',
      icon: FileInput,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        onOpenArticleEvent(event)
      }
    })
  }

  const selected = articleId && openDocuments.includes(articleId)
  return (
    <div
      ref={rowRef}
      tabIndex={0}
      className={cn(
        'flex flex-col gap-2 text-sm px-6 pt-2.5 pb-4 hover:bg-muted focus:outline-table-selected',
        selected ? 'bg-table-selected focus:bg-table-selected' : ''
      )}
      onClick={(event) => {
        if (assignmentType === 'text' || assignmentType === 'flash') {
          onOpenArticleEvent(event)
        } else {
          onSelect()
        }
      }}
    >
      <div className='flex flex-row gap-6 items-center justify-items-between justify-between'>

        <div className='flex grow gap-2 items-center'>
          <Button
            variant='icon'
            className='p-0 pr-2'
          >
            <AssignmentType path={`meta.core/assignment[${index}].meta.core/assignment-type`} />
          </Button>
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
            title='Skapa artikel?'
            description={`Vill du skapa en artikel för uppdraget${title ? ' ' + title : ''}?`} // TODO: Display information that will be forwarded from the assignment
            secondaryLabel='Avbryt'
            primaryLabel='Skapa'
            onPrimary={(event) => {
              setShowCreateDialog(false)
              if (!provider?.document) {
                return
              }

              const id = crypto.randomUUID()
              const onDocumentCreated = (): void => {
                setTimeout(() => {
                  appendArticle({ document: provider?.document, id, index, slug: '' })
                }, 0)
              }

              const payload = createArticlePayload(provider?.document, index)

              openArticle(event,
                { id, payload },
                'blank',
                { onDocumentCreated }
              )
            }}
            onSecondary={() => {
              setShowCreateDialog(false)
            }}
          />
        )
      }
    </div>
  )
}
