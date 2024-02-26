import { ComboBox } from '@/components/ui'
import { Categories } from '@/defaults/categories'
import { useYObserver } from '@/hooks'

export const PlanCategory = (): JSX.Element => {
  const { get, set } = useYObserver('links.core/category[0]')

  const selectedOption = Categories.find(c => c.value === get('title'))

  return <ComboBox
    size='xs'
    className='w-fit text-muted-foreground text-xs font-sans font-normal whitespace-nowrap text-ellipsis px-2'
    options={Categories}
    selectedOption={selectedOption}
    placeholder={selectedOption?.label || 'Add Category'}
    onSelect={(option) => {
      if (option.value === selectedOption?.value) {
        console.log('Should delete value')
      }
      set(option.payload)
    }}
    />
}
