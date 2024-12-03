import { Badge, SheetClose } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'
import { Editor } from '../../../components/PlainEditor'

export const ModalContent = ({ id, role, handleClose }: {
  id: string
  role?: string
  handleClose: () => void
}): JSX.Element => {
  return (
    <>
      {role === 'pressrelease' && (
        <Badge
          variant='destructive'
          className='w-32 h-8'
        >
          Pressmeddelande
        </Badge>
      )}
      <Editor id={id} />
      <SheetClose
        className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center outline-none'
        onClick={() => handleClose()}
      >
        <X strokeWidth={1.75} size={18} />
      </SheetClose>
    </>
  )
}
