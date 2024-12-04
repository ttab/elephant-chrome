import { Badge, SheetClose } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'
import { Editor } from '../../../components/PlainEditor'

export const ModalContent = ({ id, role, handleClose }: {
  id: string
  role?: string
  handleClose: () => void
}): JSX.Element => (
  <div className='w-full flex'>
    <div className='flex-1'>
      {role === 'pressrelease' && (
        <Badge
          variant='destructive'
          className='w-32 h-8'
        >
          Pressmeddelande
        </Badge>
      )}
    </div>
    <div className='flex-2'>
      <Editor id={id} />
    </div>
    <div className='flex-1 flex justify-end -mr-4 -mt-4'>
      <SheetClose
        className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center outline-none'
        onClick={handleClose}
      >
        <X strokeWidth={1.75} size={18} />
      </SheetClose>
    </div>
  </div>
)
