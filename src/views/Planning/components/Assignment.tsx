import { TextBox } from '@/components/ui'
import { useCollaboration, useYObserver } from '@/hooks'
import { Button } from '@ttab/elephant-ui'
import { Clock10Icon, MessageCircleMore } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type * as Y from 'yjs'
import * as yMapValueByPath from '@/lib/yMapValueByPath'
import { AssignmentType } from '@/components/DataItem/AssignmentType'
import { useYValue } from '@/hooks/useYValue'
import { type Block } from '@/protos/service'
import { Assignees } from './AssignmentAssignees'

export const Assignment = ({ index, setSelectedAssignment, className }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
  className?: string
}): JSX.Element => {
  const { provider } = useCollaboration()
  const { get: getInProgress } = useYObserver('meta', `core/assignment[${index}]`)
  const inProgress = getInProgress('__inProgress') === true

  const [title] = useYValue<string | undefined>(`meta.core/assignment[${index}].title`)
  const [slugLine] = useYValue<Block | undefined>(`meta.core/assignment[${index}].meta.tt/slugline[0].value`)
  const [assignmentType] = useYValue<string | undefined>(`meta.core/assignment[${index}].meta.core/assignment-type[0].value`)

  return (
    <div className={cn('border rounded-md shadow-xl', className)}>
      <div className="flex flex-col gap-6 p-6">
        <TextBox
          path={`meta.core/assignment[${index}].title`}
          placeholder='Uppdragsrubrik'
          className="font-semibold text-sm leading-5"
          singleLine={true}
          autoFocus={true}
        />

        <TextBox
          path={`meta.core/assignment[${index}].meta.tt/slugline[0].value`}
          placeholder='Lägg till slug'
          className="text-sm leading-4 px-0 opacity-80"
          singleLine={true}
        />

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
            path={`core/assignment[${index}].meta.core/assignment-type`}
            editable={inProgress}
          />
          <Assignees path={`meta.core/assignment[${index}].links.core/author`} />

          <Clock10Icon size={20} strokeWidth={1.75} />
        </div>

        <div className='flex items-center justify-end gap-4'>
          {inProgress &&
            <Button
              variant="ghost"
              onClick={(evt) => {
                evt.preventDefault()
                evt.stopPropagation()

                if (provider?.document) {
                  const yEle = provider.document.getMap('ele')
                  const meta = yEle.get('meta') as Y.Map<unknown>
                  if (meta.has('core/assignment')) {
                    const assignments = meta.get('core/assignment') as Y.Array<unknown>
                    assignments.delete(index, 1)
                  }

                  setSelectedAssignment(undefined)
                }
              }}>
              Avbryt
            </Button>
          }

          <Button
            variant="outline"
            disabled={!title || (assignmentType === 'text' && !slugLine)}
            onClick={(evt) => {
              evt.preventDefault()
              evt.stopPropagation()

              if (provider?.document && inProgress) {
                const yEle = provider.document.getMap('ele')
                const assignment = yMapValueByPath.get(
                  yEle.get('meta') as Y.Map<unknown>,
                  `core/assignment[${index}]`
                )

                if (assignment) {
                  assignment.delete('__inProgress')
                }
              }

              setSelectedAssignment(undefined)
            }}
          >
            {inProgress ? 'Lägg till' : 'Stäng'}
          </Button>
        </div>
      </div>
    </div>
  )
}
