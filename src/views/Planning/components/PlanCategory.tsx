import { ComboBox } from '@/components/ui'
import { Categories } from '@/defaults/categories'
import { useYObserver } from '@/hooks'

export const PlanCategory = (): JSX.Element | undefined => {
  const { get, set, loading } = useYObserver('planning', 'links.core/category[0]')

  const selectedOption = Categories.find(c => c.value === get('title'))

  return !loading
    ? <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={Categories}
        selectedOption={selectedOption}
        placeholder={selectedOption?.label || 'Category'}
        onSelect={(option) => {
          if (option.value === selectedOption?.value) {
            console.log('Should delete value')
          }
          set(option.payload)
        }}
    />
    : undefined
}
