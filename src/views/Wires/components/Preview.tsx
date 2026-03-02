import type { Wire } from '@/shared/schemas/wire'
import { WirePreview } from '@/components/WirePreview/WirePreview'

export const Preview = ({ wire, onClose }: {
  wire: Wire
  onClose: () => void
}) => {
  return <WirePreview wire={wire} onClose={onClose} />
}
