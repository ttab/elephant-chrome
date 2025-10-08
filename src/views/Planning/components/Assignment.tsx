import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { MessageCircleMoreIcon, TagsIcon } from '@ttab/elephant-ui/icons'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { AssignmentTime } from '@/components/AssignmentTime'
import { Assignees } from '@/components/Assignees'
import { Title } from '@/components/Title'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import { Form } from '@/components/Form'
import { type FormProps } from '@/components/Form/Root'
import { useEffect, useRef } from 'react'
import { AssignmentVisibility } from '@/components/DataItem/AssignmentVisibility'
import { type YDocument, useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Assignment = ({ ydoc, index, onAbort, onClose, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  index: number
  onClose: () => void
  onAbort?: () => void
  className?: string
} & FormProps): JSX.Element => {
  const [assignment] = useYValue<boolean>(ydoc.document, `meta.core/assignment[${index}]`)
  const [articleId] = useYValue<string>(ydoc.document, `meta.core/assignment[${index}].links.core/article[0].uuid`)
  const [flashId] = useYValue<string>(ydoc.document, `meta.core/assignment[${index}].links.core/flash[0].uuid`)
  const [editorialInfoId] = useYValue<string>(ydoc.document, `meta.core/assignment[${index}].links.core/editorial-info[0].uuid`)
  const [assignmentInProgress] = useYValue<boolean>(ydoc.document, `meta.core/assignment[${index}].__inProgress`)
  const [assignmentType] = useYValue<string | undefined>(ydoc.document, `meta.core/assignment[${index}].meta.core/assignment-type[0].value`)
  const [description] = useYValue<Y.XmlText | undefined>(ydoc.document, `meta.core/assignment[${index}].meta.core/description[0].data.text`, true)
  const documentId = articleId || flashId || editorialInfoId

  const formRef = useRef<HTMLDivElement>(null)

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

  if (!ydoc || !assignment) {
    return <></>
  }

  return (
    <div className='flex flex-col rounded-md border shadow-xl -mx-1 -my-1 z-10 bg-background' ref={formRef}>
      <Form.Root asDialog={true} onChange={onChange}>
        <Form.Content>
          <Form.Title>
            <Title
              ydoc={ydoc}
              path={`meta.core/assignment[${index}].title`}
              placeholder='Uppdragsrubrik'
              autoFocus={true}
            />
          </Form.Title>
          <TextBox
            ydoc={ydoc}
            value={description}
            placeholder='Internt meddelande'
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
                  disabled={!!documentId}
                  path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`}
                />
              </Form.Group>
            )}


          <Form.Group>
            <AssignmentType
              ydoc={ydoc}
              path={`meta.core/assignment[${index}]`}
              editable={!articleId && !flashId}
            />
            <Assignees
              ydoc={ydoc}
              path={`meta.core/assignment[${index}].links.core/author`}
              placeholder='Lägg till uppdragstagare'
            />
            <AssignmentTime index={index} />
            <AssignmentVisibility
              ydoc={ydoc}
              path={`meta.core/assignment[${index}].data.public`}
              disabled={!!documentId}
              editable
              className='ml-auto'
            />
          </Form.Group>
        </Form.Content>

        <Form.Footer>
          <Form.Submit onSubmit={onClose} onReset={onAbort}>
            <div className='flex gap-2 justify-end pt-4'>
              {assignmentInProgress && !!onAbort
                && (
                  <Button type='reset' variant='ghost'>
                    Avbryt
                  </Button>
                )}
              <Button type='submit' variant='outline' className='whitespace-nowrap'>
                {assignmentInProgress ? 'Lägg till' : 'Stäng'}
              </Button>
            </div>
          </Form.Submit>
        </Form.Footer>
      </Form.Root>
    </div>
  )
}
