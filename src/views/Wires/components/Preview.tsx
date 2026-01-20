import { Badge, Button } from '@ttab/elephant-ui'
import { Edit2Icon, XIcon } from '@ttab/elephant-ui/icons'
import { decodeString } from '@/lib/decodeString'
import type { Wire } from '@/shared/schemas/wire'
import { Editor } from '@/components/PlainEditor'


export const Preview = ({ wire, onClose }: {
  wire: Wire
  onClose: () => void
}) => {
  const data = {
    source: wire?.fields['document.rel.source.uri']?.values[0]
      ?.replace('wires://source/', ''),
    provider: wire?.fields['document.rel.provider.uri']?.values[0]
      ?.replace('wires://provider/', ''),
    role: wire?.fields['document.meta.tt_wire.role'].values[0],
    newsvalue: wire?.fields['document.meta.core_newsvalue.value']?.values[0]
    // status: getWireStatus('Wires', preview)
  }

  return (
    <>
      <div className='flex items-center justify-between py-2 ps-4 pe-2 bg-default rounded-t-lg'>
        <div className='text-sm flex flex-row gap-1'>
          {data?.source && (
            <Badge className='h-6'>
              {data.source}
            </Badge>
          )}
          {data?.provider && data.provider !== data.source && data.provider.toLocaleLowerCase() !== data.source && (
            <Badge className='h-6'>
              {decodeString(data.provider)}
            </Badge>
          )}
          {data?.role === 'pressrelease' && (
            <Badge className='h-6 bg-gray-400'>
              Pressmeddelande
            </Badge>
          )}

          {data?.newsvalue === '6' && (
            <Badge variant='destructive' className='h-6'>
              Flash
            </Badge>
          )}
        </div>

        <div className='flex items-center justify-end gap-1'>
          <Button
            variant='ghost'
            className='w-9 h-9 px-0'
            onMouseDown={(e) => { e.preventDefault() }}
            onClick={(e) => {
            // navigate(`/users/${previewUser.id}`)
            }}
          >
            <Edit2Icon size={16} strokeWidth={1.75} className='opacity-60' />
          </Button>

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
      </div>

      <div className='flex flex-col h-full overflow-y-auto'>
        <Editor
          id={wire.id}
          textOnly={true}
          direct
        />
      </div>
    </>
  )
}
