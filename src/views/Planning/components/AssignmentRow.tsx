import { TimeDisplay } from '@/components/DataItem/TimeDisplay'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssigneeAvatars } from '@/components/DataItem/AssigneeAvatars'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Delete, Edit, FileInput } from '@ttab/elephant-ui/icons'
import { type MouseEvent, useMemo, useState, useCallback } from 'react'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import { useLink } from '@/hooks/useLink'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Prompt } from './Prompt'
import { appendArticle } from '@/lib/createYItem'
import { useCollaboration } from '@/hooks/useCollaboration'
import type * as Y from 'yjs'
import { Button } from '@ttab/elephant-ui'
import { type Block } from '@/protos/service'

export const AssignmentRow = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
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
      setSelectedAssignment(index)
    }}>
      <AssignmentRowContent
        index={index}
        setSelectedAssignment={setSelectedAssignment}
      />
    </div>
  )
}

const AssignmentRowContent = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
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

  useKeydownGlobal((evt) => {
    if (evt.key === 'Escape') {
      setSelectedAssignment(undefined)
    }
  })

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
        setSelectedAssignment(index)
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
          <AssignmentType path={`core/assignment[${index}].meta.core/assignment-type`} />
          <AssigneeAvatars assignees={authors.map((author) => author.name)} />

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
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
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
            if (!provider?.document) {
              return
            }
            const yEle = provider.document.getMap('ele')
            const meta = yEle.get('meta') as Y.Map<unknown>
            if (meta.has('core/assignment')) {
              const assignments = meta.get('core/assignment') as Y.Array<unknown>
              assignments.delete(index, 1)
            }
            setSelectedAssignment(undefined)
          }}
          onSecondary={() => {
            setShowVerifyDialog(false)
          }}
        />
      }
      {showCreateDialog &&
        <Prompt
          title="Skapa artikel?"
          description={`Vill du skapa en artikel för uppdraget${` ${title}` || ''}?`}
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

            openArticle(event,
              { id },
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
