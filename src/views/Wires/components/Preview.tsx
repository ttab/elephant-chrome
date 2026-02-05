import { Badge, Button } from '@ttab/elephant-ui'
import { CheckIcon, EyeIcon, FolderIcon, XIcon } from '@ttab/elephant-ui/icons'
import { decodeString } from '@/lib/decodeString'
import type { Wire } from '@/shared/schemas/wire'
import { Editor } from '@/components/PlainEditor'
import { getWireStatus } from '@/lib/getWireStatus'
import { DocumentHistory } from './DocumentHistory'

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
    status: getWireStatus(wire),
    version: BigInt(wire?.fields['current_version'].values[0]) ?? 1n
  }

  return (
    <>
      <div className='flex items-center justify-between py-2 px-12 bg-default rounded-t-lg'>
        <div className='text-sm flex flex-row gap-2'>
          {data?.source && (
            <Badge className='h-6 pointer-events-none'>
              {data.source}
            </Badge>
          )}

          {data?.provider && data.provider !== data.source && data.provider.toLocaleLowerCase() !== data.source && (
            <Badge className='h-6'>
              {decodeString(data.provider)}
            </Badge>
          )}

          {data?.role === 'pressrelease' && (
            <Badge className='h-6 bg-gray-400 pointer-events-none'>
              Pressmeddelande
            </Badge>
          )}

          {data?.newsvalue === '6' && (
            <Badge variant='destructive' className='h-6 pointer-events-none'>
              Flash
            </Badge>
          )}

          {data?.status && data.status === 'read' && (
            <Badge className='h-6 pe-2 bg-approved-background text-foreground border border-approved pointer-events-none'>
              <span className='me-2'>Läst</span>
              <EyeIcon size={12} fill='oklch(96.62% 0.0108 149.86)' />
            </Badge>
          )}

          {data?.status && data.status === 'saved' && (
            <Badge className='h-6 pe-2 bg-done-background text-foreground border border-done pointer-events-none'>
              <span className='me-2'>Sparad</span>
              <FolderIcon size={12} fill='oklch(98.51% 0.0264 99.9)' />
            </Badge>
          )}

          {data?.status && data.status === 'used' && (
            <Badge className='h-6 pe-2 bg-usable-background text-foreground border border-usable pointer-events-none'>
              <span className='me-2'>Använd</span>
              <CheckIcon size={12} fill='oklch(95.05% 0.022 263.19)' />
            </Badge>
          )}
        </div>

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

      <div className='grid-rows-[auto_1fr] max-w-full w-full overflow-y-auto mx-auto'>
        <div className='mx-12 bg-muted rounded-md py-2 px-4 mt-2'>
          <DocumentHistory uuid={wire.id} currentVersion={data?.version} />
        </div>
        <Editor
          id={wire.id}
          textOnly={true}
          direct
          disableScroll={true}
        />
      </div>
    </>
  )
}
