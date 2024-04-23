import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { Categories } from '@/defaults'
import { useYObserver } from '@/hooks'
import { useRef } from 'react'

export const PlanCategory = (): JSX.Element | undefined => {
  const { get, set } = useYObserver('links', 'core/category[0]')
  const setFocused = useRef<(value: boolean) => void>(null)
  const uuid = get('uuid')
  const selectedOption = Categories.find(c => c.value === uuid)

  return (
    <Awareness name='PlanCategory' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={Categories}
        selectedOption={selectedOption}
        placeholder={selectedOption?.label || 'Category'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          if (option.value === selectedOption?.value) {
            console.log('Should delete value')
          }
          set(option.payload)
        }}
      />
    </Awareness>
  )
}
