import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { useCategories, useYValue } from '@/hooks'
import { Block } from '@/protos/service'
import { useRef } from 'react'

// TODO: This ComboBox should be able to do multi select
export const Category = (): JSX.Element => {
  const allCategories = useCategories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [category, setCategory] = useYValue<Block | undefined>('links.core/category[0]')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOption = allCategories.find(s => s.value === category?.uuid)

  return (
    <Awareness name='Category' ref={setFocused}>
      <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={allCategories}
        selectedOption={selectedOption}
        placeholder={category?.title || 'Lägg till ämne'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          const newCategory = Block.create({
            type: 'core/category',
            rel: 'category',
            uuid: option.value,
            title: option.label
          })
          setCategory(newCategory)
        }}
      />
    </Awareness>
  )
}
