import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { Clock10Icon, MessageCircleMore, Tags } from '@ttab/elephant-ui/icons'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { useYValue } from '@/hooks/useYValue'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Assignees } from '@/components/Assignees'
import { Title } from '@/components/Title'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'
import { Form } from '@/components/Form'
import { type FormProps } from '@/components/Form/Root'

export const Assignment = ({ index, onAbort, onClose }: {
  index: number
  onClose: () => void
  onAbort?: () => void
  className?: string
} & FormProps): JSX.Element => {
  const [assignment] = useYValue<boolean>(`meta.core/assignment[${index}]`)
  const [inProgress] = useYValue<boolean>(`meta.core/assignment[${index}].__inProgress`)
  const [assignmentType] = useYValue<string | undefined>(`meta.core/assignment[${index}].meta.core/assignment-type[0].value`)

  useKeydownGlobal((evt) => {
    if (evt.key === 'Escape') {
      if (onAbort) {
        onAbort()
      } else {
        onClose()
      }
    }
  })

  if (!assignment) {
    return <></>
  }

  return (
    <div className='flex flex-col rounded-md border shadow-xl -mx-1 -my-1 z-10 bg-background'>
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

          {assignmentType === 'text'
          && (
            <Form.Group icon={Tags}>
              <SluglineEditable
                path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`}
              />
            </Form.Group>
          )}


          <Form.Group>
            <AssignmentType
              path={`meta.core/assignment[${index}].meta.core/assignment-type`}
              editable={inProgress}
            />
            <Assignees
              name='AssignmentAssignees'
              path={`meta.core/assignment[${index}].links.core/author`}
              placeholder='Lägg till uppdragstagare'
            />
            <Clock10Icon size={20} strokeWidth={1.75} />
          </Form.Group>

        </Form.Content>
        <Form.Footer>
          <Form.Submit onSubmit={onClose} onReset={onAbort}>
            <div className='flex gap-2 justify-end pt-4'>
              {inProgress && !!onAbort
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
                {inProgress ? 'Lägg till' : 'Stäng'}
              </Button>
            </div>

          </Form.Submit>
        </Form.Footer>
      </Form.Root>
    </div>
  )
}
