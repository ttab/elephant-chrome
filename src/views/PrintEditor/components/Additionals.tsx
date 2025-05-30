import { useYValue } from '@/hooks/useYValue'
import { Label, Checkbox } from '@ttab/elephant-ui'

export interface Additional {
  name: string
  value: string
}

export const Additionals = ({ basePath }: {
  basePath: string
}): JSX.Element | null => {
  const [additionals, setAdditionals] = useYValue<Additional[]>(`${basePath}.meta.tt/print-features[0].content.tt/print-feature`)

  const handleChange = (index: number) => {
    if (!additionals) return
    const updated = additionals.map((item, i) =>
      i === index ? { ...item, value: item.value === 'true' ? 'false' : 'true' } : item
    )
    setAdditionals(updated)
  }

  if (additionals?.length) {
    return (
      <div className='col-span-12 row-span-1 flex flex-col gap-2 mt-1'>
        <h4 className='text-sm font-bold'>Tillägg</h4>
        {additionals.map((additional, index) => (
          <Additional
            key={additional.name}
            additional={additional}
            index={index}
            onChange={handleChange}
          />
        ))}
      </div>
    )
  }

  return null
}

const Additional = ({ additional, index, onChange }: {
  additional: Additional
  index: number
  onChange: (index: number) => void
}) => (
  <Label key={additional.name} className='flex items-center gap-2'>
    <Checkbox
      checked={additional.value === 'true'}
      onCheckedChange={() =>
        onChange(index)}
    />
    {additional.name}
  </Label>
)
