import { Button } from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'
import type { Wire } from '@/shared/schemas/wire'
import { WirePreview } from '@/components/WirePreview/WirePreview'

export const Preview = ({ wire, onClose }: {
  wire: Wire
  onClose: () => void
}) => {
  return (
    <>
      <div className='flex items-center justify-end py-2 px-12 bg-default rounded-t-lg'>
        <Button
          variant='ghost'
          className='w-9 h-9 px-0'
          onMouseDown={(e) => { e.preventDefault() }}
          onClick={(e) => {
            e.preventDefault()
            onClose()
          }}
        >
          <XIcon size={16} strokeWidth={1.75} className='opacity-60' />
        </Button>
      </div>

      <WirePreview wire={wire} />
    </>
  )
}
