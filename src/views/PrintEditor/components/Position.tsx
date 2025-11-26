import { Input } from '@ttab/elephant-ui'
import type { YDocument } from '@/modules/yjs/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const Position = ({ ydoc, basePath, onChange }: {
  ydoc: YDocument<Y.Map<unknown>>
  basePath: string
  onChange?: (value: boolean) => void
}) => {
  const [position, setPosition] = useYValue<string>(ydoc.ele, `${basePath}.data.position`)
  return (
    <div className='col-span-2 row-span-1'>
      <Input
        type='text'
        className='h-9'
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
