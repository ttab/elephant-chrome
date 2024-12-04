import { Badge, SheetClose } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'
import { Editor } from '../../../components/PlainEditor'

export const ModalContent = ({ id, source, role, handleClose }: {
  id: string
  source: string
  role?: string
  handleClose: () => void
}): JSX.Element => (
  <div className='w-full flex gap-4 pt-2'>
    <div className='flex flex-col flex-1 gap-2'>
      <Badge
        className='w-32 h-8 justify-center align-center'
      >
        {source.replace('wires://source/', '')}
      </Badge>
      {role === 'pressrelease' && (
        <Badge
          variant='destructive'
          className='w-32 h-8 justify-center align-center'
        >
          Pressmeddelande
        </Badge>
      )}
    </div>
    <div className='flex-2 -mt-2'>
      <Editor id={id} />
    </div>
    <div className='flex-1 flex justify-end -mr-2 -mt-3'>
      <SheetClose
        className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center outline-none'
        onClick={handleClose}
      >
        <X strokeWidth={1.75} size={18} />
      </SheetClose>
    </div>
  </div>
)
