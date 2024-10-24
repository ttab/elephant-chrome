import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Delete, Edit, FileInput } from '@ttab/elephant-ui/icons'
import { type MouseEvent, useMemo, useState, useCallback } from 'react'
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

export const AssignmentRow = ({ index, onSelect }: {
  index: number
  onSelect: () => void
}): JSX.Element => {
  const assPath = `meta.core/assignment[${index}]`
  const [inProgress] = useYValue(`${assPath}.__inProgress`)

  if (inProgress) {
    return <></>
  }

  return (
    <div onClick={(ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      onSelect()
    }}>
      <AssignmentRowContent
        index={index}
        onSelect={onSelect}
      />
    </div>
  )
}

const AssignmentRowContent = ({ index, onSelect }: {
  index: number
  onSelect: () => void
}): JSX.Element => {
  const { provider } = useCollaboration()
  const openArticle = useLink('Editor')
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

  const onOpenArticleEvent = useCallback(<T extends HTMLElement>(event: MouseEvent<T>) => {
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

  if (assignmentType === 'text') {
    menuItems.push({
      label: 'Öppna artikel',
      icon: FileInput,
      item: <T extends HTMLElement>(event: MouseEvent<T>) => {
        onOpenArticleEvent(event)
      }
    })
  }

  return (
    <div className='flex flex-col gap-2 text-sm px-4 pt-2.5 pb-4 hover:bg-muted'>
      <div className="flex flex-row gap-6 items-center justify-items-between justify-between">

        <div className="flex grow gap-4 items-center">
          <AssignmentType path={`meta.core/assignment[${index}].meta.core/assignment-type`} />
          <AssigneeAvatars assignees={authors.map((author) => author.title)} />

          <div className="hidden items-center @3xl/view:flex">
            <SluglineButton path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`} />
          </div>
        </div>

        <div className="flex grow items-center justify-end gap-1.5">
          <div className="min-w-[64px] whitespace-nowrap">
            {assTime ? <TimeDisplay date={assTime} /> : ''}
          </div>

          {assignmentType === 'text' &&
            <Button
              variant='ghost'
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-accent2"
              onClick={<T extends HTMLElement>(event: MouseEvent<T>) => {
                onOpenArticleEvent(event)
              }}>
              <FileInput size={18} strokeWidth={1.75} />
            </Button>
          }

          {!inProgress &&
            <DotDropdownMenu
              items={menuItems}
            />
          }
        </div>
      </div>

      <div className="text-[15px] font-medium">
        <span className='pr-2 leading-relaxed group-hover/assrow:underline'>{title}</span>
      </div>

      {!!description &&
        <div className='font-light'>
          {description}
        </div>
      }

      <div className="@3xl/view:hidden">
        <SluglineButton path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`} />
      </div>

      {showVerifyDialog &&
        <Prompt
          title="Ta bort?"
          description={`Vill du ta bort uppdraget${` ${title}` || ''}?`}
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
      }

      {showCreateDialog &&
        <Prompt
          title="Skapa artikel?"
          description={`Vill du skapa en artikel för uppdraget${` ${title}` || ''}?`} // TODO: Display information that will be forwarded from the assignment
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
      }
    </div>
  )
}
