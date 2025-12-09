import { Input } from '@ttab/elephant-ui'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Position = ({ ydoc, basePath, onChange, className }: {
  ydoc: YDocument<Y.Map<unknown>>
  basePath: string
  onChange?: (value: boolean) => void
  className?: string
}) => {
  const [position, setPosition] = useYValue<string>(ydoc.ele, `${basePath}.data.position`)
  return (
    <div className={className}>
      <Input
        type='text'
        className='h-9 w-full'
        placeholder='Position'
        value={position}
        onChange={(e) => {
          onChange?.(true)
          setPosition(e.target.value)
        }}
      />
    </div>
  )
}
