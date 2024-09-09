import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useCategories, useYValue } from '@/hooks'
import { Block } from '@/protos/service'
import { useRef } from 'react'

export const Category = (): JSX.Element => {
  const allCategories = useCategories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const [categories, setCategories] = useYValue<Block[] | undefined>('links.core/category')

  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = allCategories.filter(category =>
    categories?.some(cat => cat.uuid === category.value)
  )

  return (
    <Awareness name='Category' ref={setFocused}>
      <ComboBox
        max={3}
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={allCategories}
        selectedOptions={selectedOptions}
        placeholder={'Lägg till ämne'}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          if ((categories || [])?.some((c) => c.uuid === option.value)) {
            setCategories(categories?.filter((c: Block) => {
              return c.uuid !== option.value
            }))
          } else {
            setCategories([...(categories || []), Block.create({
              type: 'core/category',
              rel: 'category',
              uuid: option.value,
              title: option.label
            })])
          }
        }}
      />
    </Awareness>
  )
}
