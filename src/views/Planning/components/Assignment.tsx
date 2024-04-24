import { useYObserver } from '@/hooks'
import { Clock10Icon, FileTextIcon, UserPlus } from '@ttab/elephant-ui/icons'
import * as Y from 'yjs'

export const Assignment = ({ index, setSelectedAssignment }: {
  index: number
  setSelectedAssignment: React.Dispatch<React.SetStateAction<number | undefined>>
}): JSX.Element => {
  const { get: getTitle } = useYObserver('meta', `core/assignment[${index}]`)

  return (
    <div className='flex flex-col border rounded-md shadow-xl opacity-50'>
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
              // FIXME: If this was a newly created/added we need to remove it
              setSelectedAssignment(undefined)
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
