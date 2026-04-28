import type { Wire } from '@/shared/schemas/wire'
import { WirePreview } from '@/components/WirePreview'

export const Preview = ({ wire }: {
  wire: Wire
}) => {
  return <WirePreview wire={wire} />
}
