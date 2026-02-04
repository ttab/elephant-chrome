import { Badge, Button } from '@ttab/elephant-ui'
import { CheckIcon, EyeIcon, FolderIcon, XIcon } from '@ttab/elephant-ui/icons'
import { decodeString } from '@/lib/decodeString'
import type { Wire } from '@/shared/schemas/wire'
import { Editor } from '@/components/PlainEditor'
import { getWireStatus } from '@/lib/getWireStatus'


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
    newsvalue: wire?.fields['document.meta.core_newsvalue.value']?.values[0],
    status: getWireStatus(wire)
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
          {data?.status && data.status === 'read' && (
            <Badge className='h-6 pe-2 bg-approved-background text-foreground border border-approved'>
              <span className='me-2'>Läst</span>
              <EyeIcon size={12} fill='oklch(96.62% 0.0108 149.86)' />
            </Badge>
          )}

          {data?.status && data.status === 'saved' && (
            <Badge className='h-6 pe-2 bg-done-background text-foreground border border-done'>
              <span className='me-2'>Sparad</span>
              <FolderIcon size={12} fill='oklch(98.51% 0.0264 99.9)' />
            </Badge>
          )}

          {data?.status && data.status === 'used' && (
            <Badge className='h-6 pe-2 bg-usable-background text-foreground border border-usable'>
              <span className='me-2'>Använd</span>
              <CheckIcon size={12} fill='oklch(95.05% 0.022 263.19)' />
            </Badge>
          )}

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
