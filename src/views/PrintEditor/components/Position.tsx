import { useYValue } from '@/hooks/useYValue'
import { Input } from '@ttab/elephant-ui'

export const Position = ({ basePath }: { basePath: string }) => {
  const [position, setPosition] = useYValue<string>(`${basePath}.data.position`)
  return (
    <div className='col-span-2 row-span-1'>
      <Input
        type='text'
        className='h-9'
        placeholder='Position'
        value={position}
        onChange={(e) => {
          setPosition(e.target.value)
        }}
      />
    </div>
  )
}
