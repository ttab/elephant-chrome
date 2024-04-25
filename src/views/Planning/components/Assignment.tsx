import { useCollaboration, useYObserver } from '@/hooks'
import { Clock10Icon, FileTextIcon, UserPlus } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import type * as Y from 'yjs'

export const Assignment = ({ index, setSelectedAssignment, className }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
  className?: string
}): JSX.Element => {
  const { provider } = useCollaboration()
  const { get: getTitle } = useYObserver('meta', `core/assignment[${index}]`)

  return (
    <div className={cn('flex flex-col border rounded-md shadow-xl opacity-50', className)}>
      <div className='flex gap-4 p-4 items-center'>
        <div className='text-xl text-gray'>{(getTitle('title') as Y.XmlText)?.toJSON()}</div>
        <div className='border rounded-sm p-1 text-xs text-gray'>Lägg till slugg</div>
      </div>

      <div className='text-sm text-gray p-2 min-h-24 p-4'>
        Lägg till beskrivning
      </div>

      <div className='flex items-center justify-between border-t px-4 h-16'>
        <div className='flex items-center justify-start gap-6'>
          <UserPlus size={20} strokeWidth={1.75} />
          <FileTextIcon size={20} strokeWidth={1.75} />
          <Clock10Icon size={20} strokeWidth={1.75} />
        </div>

        <div className='flex items-center justify-end gap-4'>
          <button
            className='rounded-sm text-gray text-sm px-4 py-2'
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
            Avbryt
          </button>

          <button
            className='border rounded-sm text-gray text-sm px-4 py-2'
            onClick={(evt) => {
              evt.preventDefault()
              setSelectedAssignment(undefined)
            }}>
            Klar
          </button>
        </div>
      </div>
    </div>
  )
}
