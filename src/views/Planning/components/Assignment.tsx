import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { MessageCircleMore, Tags } from '@ttab/elephant-ui/icons'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { useYValue } from '@/hooks/useYValue'
import { AssignmentTime } from '@/components/AssignmentTime'
import { Assignees } from '@/components/Assignees'
import { Title } from '@/components/Title'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import { Form } from '@/components/Form'
import { type FormProps } from '@/components/Form/Root'
import { useEffect, useRef } from 'react'
import { AssignmentVisibility } from '@/components/DataItem/AssignmentVisibility'

export const Assignment = ({ index, onAbort, onClose }: {
  index: number
  onClose: () => void
  onAbort?: () => void
  className?: string
} & FormProps): JSX.Element => {
  const [assignment] = useYValue<boolean>(`meta.core/assignment[${index}]`)
  const [articleId] = useYValue<string>(`meta.core/assignment[${index}].links.core/article[0].uuid`)
  const [flashId] = useYValue<string>(`meta.core/assignment[${index}].links.core/flash[0].uuid`)
  const [editorialInfoId] = useYValue<string>(`meta.core/assignment[${index}].links.core/editorial-info[0].uuid`)
  const [assignmentInProgress] = useYValue<boolean>(`meta.core/assignment[${index}].__inProgress`)
  const [assignmentType] = useYValue<string | undefined>(`meta.core/assignment[${index}].meta.core/assignment-type[0].value`)

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

  if (!assignment) {
    return <></>
  }

  return (
    <div className='flex flex-col rounded-md border shadow-xl -mx-1 -my-1 z-10 bg-background' ref={formRef}>
      <Form.Root asDialog={true}>
        <Form.Content>
          <Form.Title>
            <Title
              path={`meta.core/assignment[${index}].title`}
              placeholder='Uppdragsrubrik'
              autoFocus={true}
            />
          </Form.Title>
          <TextBox
            path={`meta.core/assignment[${index}].meta.core/description[0].data.text`}
            placeholder='Internt meddelande'
            icon={(
              <MessageCircleMore
                size={18}
                strokeWidth={1.75}
                className='text-muted-foreground mr-4'
              />
            )}
          />

          {(assignmentType === 'text' || assignmentType === 'editorial-info')
          && (
            <Form.Group icon={Tags}>
              <SluglineEditable
                disabled={!!documentId}
                path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`}
              />
            </Form.Group>
          )}


          <Form.Group>
            <AssignmentType
              path={`meta.core/assignment[${index}]`}
              editable={!articleId && !flashId}
            />
            <Assignees
              path={`meta.core/assignment[${index}].links.core/author`}
              placeholder='Lägg till uppdragstagare'
            />
            <AssignmentTime index={index} />
            <AssignmentVisibility
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
                <Button
                  type='reset'
                  variant='ghost'
                >
                  Avbryt
                </Button>
              )}
              <Button
                type='submit'
                variant='outline'
                className='whitespace-nowrap'
              >
                {assignmentInProgress ? 'Lägg till' : 'Stäng'}
              </Button>
            </div>

          </Form.Submit>
        </Form.Footer>
      </Form.Root>
    </div>
  )
}
