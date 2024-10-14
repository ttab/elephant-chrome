import { TextBox } from '@/components/ui'
import { Button } from '@ttab/elephant-ui'
import { Clock10Icon, MessageCircleMore } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { useYValue } from '@/hooks/useYValue'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Assignees } from '@/components/Assignees'
import { Title } from '@/components/Title'
import { type ValidateState } from '@/types/index'
import { useRef, useState } from 'react'
import { SluglineEditable } from '@/components/DataItem/SluglineEditable'

export const Assignment = ({ index, onAbort, onClose, className }: {
  index: number
  onClose: () => void
  onAbort?: () => void
  className?: string
}): JSX.Element => {
  const [assignment] = useYValue<boolean>(`meta.core/assignment[${index}]`)
  const [inProgress] = useYValue<boolean>(`meta.core/assignment[${index}].__inProgress`)
  const [assignmentType] = useYValue<string | undefined>(`meta.core/assignment[${index}].meta.core/assignment-type[0].value`)
  const [validateForm, setValidateForm] = useState<boolean>(false)

  const validateStateRef = useRef<ValidateState>({})

  const handleValidation = (block: string, label: string, value: string | undefined, reason: string): boolean => {
    validateStateRef.current = {
      ...validateStateRef.current,
      [block]: { label, valid: !!value, reason }
    }

    if (validateForm) {
      return !!value
    }

    return true
  }
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
    <div className={cn('border rounded-md shadow-xl', className)}>
      <div className="flex flex-col gap-6 p-6">
        <Title
          path={`meta.core/assignment[${index}].title`}
          placeholder='Uppdragsrubrik'
          className="font-semibold text-sm leading-5"
          autoFocus={true}
          onValidation={handleValidation}
        />

        { assignmentType === 'text' &&
          <SluglineEditable
            path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`}
            onValidation={handleValidation}
          />
        }

        <TextBox
          path={`meta.core/assignment[${index}].meta.core/description[0].data.text`}
          placeholder='Internt meddelande'
          icon={<MessageCircleMore
            size={20}
            strokeWidth={1.75}
            className='p-0 text-muted-foreground'
          />}
          className="text-sm px-0 bg-gray"
        />
      </div>

      <div className='flex items-center justify-between border-t p-4'>
        <div className='flex items-center justify-start gap-6'>
          <AssignmentType
            path={`meta.core/assignment[${index}].meta.core/assignment-type`}
            editable={inProgress}
          />
          <Assignees
            name="AssignmentAssignees"
            path={`meta.core/assignment[${index}].links.core/author`}
            placeholder='Lägg till uppdragstagare'
          />
          <Clock10Icon size={20} strokeWidth={1.75} />
        </div>

        <div className='flex items-center justify-end gap-4'>
          {inProgress && !!onAbort &&
            <Button
              variant="ghost"
              onClick={(evt) => {
                evt.preventDefault()
                evt.stopPropagation()
                onAbort()
              }}>
              Avbryt
            </Button>
          }

          <Button
            variant="outline"
            onClick={(evt) => {
              setValidateForm(true)
              evt.preventDefault()
              evt.stopPropagation()


              if (Object.values(validateStateRef.current).every((block) => block.valid)) {
                onClose()
              }
            }}
          >
            {inProgress ? 'Lägg till' : 'Stäng'}
          </Button>
        </div>
      </div>
    </div>
  )
}
