import { useYObserver } from '@/hooks/useYObserver'
import { Clock10Icon, FileTextIcon, PlusIcon, UserPlus } from '@ttab/elephant-ui/icons'
import { Assignment } from './Assignment'


export const Assignments = (): JSX.Element => {
  const { state } = useYObserver('meta', 'core/assignment')

  return (
    <div className='flex flex-col gap-2 pt-4'>
      <div className='flex flex-start'>
        <a href="#" className='flex flex-start items-center text-sm gap-2 p-2 -ml-2 rounded-sm hover:bg-gray-100' onClick={(evt) => {
          evt.preventDefault()
        }}
        >
          <div className='bg-green-400 rounded-full text-white w-5 h-5 flex justify-center items-center'>
            <PlusIcon size={14} strokeWidth={1.75} className='rounded-full' />
          </div>
          Lägg till uppdrag
        </a>
      </div>

      <div className='flex flex-col border rounded-md shadow-xl opacity-50'>
        <div className='flex gap-4 p-4 items-center'>
          <div className='text-xl text-gray'>Uppdragstitel</div>
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
            <button className='rounded-sm text-gray text-sm px-4 py-2'>Avbryt</button>
            <button className='border rounded-sm text-gray text-sm px-4 py-2'>Klar</button>
          </div>
        </div>
      </div>

      <div className="border-t">
        {Array.isArray(state) && state.map((_, index: number) => (
          <Assignment key={index} index={index} />
        ))}
      </div>
    </div>
  )
}
