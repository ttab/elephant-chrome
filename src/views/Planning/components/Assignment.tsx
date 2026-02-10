import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { MessageCircleMoreIcon, TagsIcon } from '@ttab/elephant-ui/icons'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssignmentTime } from '@/components/AssignmentTime'
import { Assignees } from '@/components/Assignees'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import { Form } from '@/components/Form'
import { type FormProps } from '@/components/Form/Root'
import { useEffect, useRef, type JSX } from 'react'
import { type YDocument, useYPath, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import { useSession } from 'next-auth/react'
import { TextInput } from '@/components/ui/TextInput'
import { useTranslation } from 'react-i18next'

export const Assignment = ({ ydoc, assignment, onAbort, onClose }: {
  ydoc: YDocument<Y.Map<unknown>>
  assignment: Y.Map<unknown>
  onClose: () => void
  onAbort?: () => void
  className?: string
} & FormProps): JSX.Element => {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const path = useYPath(assignment, true)
  const [articleId] = useYValue<string>(assignment, `links.core/article[0].uuid`)
  const [flashId] = useYValue<string>(assignment, `links.core/flash[0].uuid`)
  const [editorialInfoId] = useYValue<string>(assignment, `links.core/editorial-info[0].uuid`)
  const [assignmentType] = useYValue<string | undefined>(assignment, `meta.core/assignment-type[0].value`)
  const [title] = useYValue<Y.XmlText>(assignment, 'title', true)
  const [slugline] = useYValue<Y.XmlText>(assignment, `meta.tt/slugline[0].value`, true)
  const [description] = useYValue<Y.XmlText | undefined>(assignment, `meta.core/description[0].data.text`, true)
  const documentId = articleId || flashId || editorialInfoId

  const formRef = useRef<HTMLDivElement>(null)

  // Track assignments in progress in ctx
  const [assignmentInProgress] = useYValue(ydoc.ctx, `core/assignment.${session?.user.sub || ''}`)

  useEffect(() => {
    if (formRef.current) {
      formRef.current.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          if (onAbort) {
            onAbort()
          } else {
            onClose()
          }
        }
      })
    }
  }, [onAbort, onClose])

  if (!ydoc || !assignment || !path) {
    return <></>
  }

  return (
    <div className='flex flex-col rounded-md border shadow-xl -mx-1 -my-1 z-10 bg-background dark:bg-table-focused' ref={formRef}>
      <Form.Root asDialog={true}>
        <Form.Content>
          <Form.Title>
            <TextInput
              ydoc={ydoc}
              rootMap={!assignmentInProgress ? ydoc.ele : ydoc.ctx}
              value={title}
              label={t('core:labels.title')}
              placeholder={t('planning:assignment.title')}
              autoFocus={true}
            />
          </Form.Title>
          <TextBox
            ydoc={ydoc}
            value={description}
            placeholder={t('planning:description.internal')}
            icon={(
              <MessageCircleMoreIcon
                size={18}
                strokeWidth={1.75}
                className='text-muted-foreground mr-4'
              />
            )}
          />

          {(assignmentType === 'text' || assignmentType === 'editorial-info')
            && (
              <Form.Group icon={TagsIcon}>
                <SluglineEditable
                  ydoc={ydoc}
                  rootMap={!assignmentInProgress ? ydoc.ele : ydoc.ctx}
                  disabled={!!documentId}
                  value={slugline}
                />
              </Form.Group>
            )}


          <Form.Group>
            <AssignmentType
              assignment={assignment}
              editable={!articleId && !flashId}
            />
            <Assignees
              ydoc={ydoc}
              rootMap={!assignmentInProgress ? ydoc.ele : ydoc.ctx}
              path={`${path}.links.core/author`}
              placeholder={t('planning:assignment.actions.addAssignee')}
            />
            <AssignmentTime assignment={assignment} />

            {/* FIXME: Disable until we have an idea of how this should be clear to end-user
            <AssignmentVisibility
              ydoc={ydoc}
              path={`${path}.data.public`}
              disabled={!!documentId}
              editable
              className='ml-auto'
            /> */}
          </Form.Group>
        </Form.Content>

        <Form.Footer>
          <Form.Submit onSubmit={onClose} onReset={onAbort}>
            <div className='flex gap-2 justify-end pt-4'>
              {!!assignmentInProgress && !!onAbort && (
                <Button type='reset' variant='ghost'>
                  {t('common:actions.abort')}
                </Button>
              )}
              <Button type='submit' variant='outline' className='whitespace-nowrap'>
                {assignmentInProgress ? t('common:actions.add') : t('common:actions.close')}
              </Button>
            </div>
          </Form.Submit>
        </Form.Footer>
      </Form.Root>
    </div>
  )
}
