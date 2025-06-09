import { useYValue } from '@/hooks/useYValue'
import { Input } from '@ttab/elephant-ui'

export const Position = ({ basePath, onChange }: {
  basePath: string
  onChange?: (value: boolean) => void
}) => {
  const [position, setPosition] = useYValue<string>(`${basePath}.data.position`)
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
