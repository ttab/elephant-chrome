import { TextBox } from '@/components/ui'
import { useCollaboration, useYObserver } from '@/hooks'
import { Button } from '@ttab/elephant-ui'
import { Clock10Icon, FileTextIcon, UserPlus } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type * as Y from 'yjs'
import * as yMapValueByPath from '@/lib/yMapValueByPath'

export const Assignment = ({ index, setSelectedAssignment, className }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
  className?: string
}): JSX.Element => {
  const { provider } = useCollaboration()
  const { get: getInProgress } = useYObserver('meta', `core/assignment[${index}]`)
  const inProgress = getInProgress('__inProgress') === true

  return (
    <div className={cn('flex flex-col p-4 gap-4 border rounded-md shadow-xl', className)}>
      <TextBox
        base='meta'
        path={`core/assignment[${index}]`}
        field='title'
        placeholder='Uppdragsrubrik'
        className="font-semibold text-lg leading-4 px-0"
        singleLine={true}
      />

      <TextBox
        base='meta'
        path={`core/assignment[${index}].meta.tt/slugline[0]`}
        field='value'
        placeholder='Lägg till slug'
        className="text-sm leading-4 px-0 opacity-80"
        singleLine={true}
      />

      <TextBox
        base='meta'
        path={`core/assignment[${index}].meta.core/description[0].data`}
        field='text'
        placeholder='Beskrivning'
        className="text-md leading-4 px-0 bg-gray"
      />

      <div className='flex items-center justify-between border-t px-4 pt-4'>
        <div className='flex items-center justify-start gap-6'>
          <UserPlus size={20} strokeWidth={1.75} />
          <FileTextIcon size={20} strokeWidth={1.75} />
          <Clock10Icon size={20} strokeWidth={1.75} />
        </div>

        <div className='flex items-center justify-end gap-4'>
          {inProgress &&
            <Button
              variant="secondary"
              onClick={(evt) => {
                evt.preventDefault()
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
              Ta bort
            </Button>
          }

          <Button
            onClick={(evt) => {
              evt.preventDefault()
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
            Klar
          </Button>
        </div>
      </div>
    </div>
  )
}
