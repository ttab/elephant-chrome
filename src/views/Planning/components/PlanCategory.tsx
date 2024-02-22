import { ComboBox } from '@/components/ui'
import { Categories } from '@/defaults/categories'
import { useYObserver } from '@/hooks'
import { type Block } from '@/protos/service'
import type * as Y from 'yjs'

export const PlanCategory = ({ yArray }: { yArray?: Y.Array<unknown> }): JSX.Element => {
  const [category, setCategory] = useYObserver<Block>(yArray, '[0]')

  const selectedOption = Categories.find(c => c.value === category?.title)

  return <ComboBox
    size='xs'
    className='w-fit text-muted-foreground text-xs font-sans font-normal whitespace-nowrap text-ellipsis px-2'
    options={Categories}
    selectedOption={selectedOption}
    placeholder={selectedOption?.label || 'Add Category'}
    onSelect={(option) => {
      setCategory(option.payload)
    }}
    />
}
