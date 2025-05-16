import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { useCategories, useYValue } from '@/hooks'
import { Block } from '@ttab/elephant-api/newsdoc'

import { useRef } from 'react'
import type { FormProps } from './Form/Root'

export const Category = ({ asDialog, onChange }: FormProps): JSX.Element => {
  const allCategories = useCategories().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  const path = 'links.core/category'
  const [categories, setCategories] = useYValue<Block[] | undefined>(path)
  const setFocused = useRef<(value: boolean, start: string) => void>(() => { })
  const selectedOptions = allCategories.filter((category) =>
    categories?.some((cat) => cat.uuid === category.value)
  )

  return (
    <Awareness ref={setFocused} path={path}>
      <ComboBox
        max={3}
        sortOrder='label'
        size='xs'
        modal={asDialog}
        options={allCategories}
        selectedOptions={selectedOptions}
        placeholder='Lägg till ämne'
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(true, (isOpen) ? path : '')
          }
        }}
        onSelect={(option) => {
          onChange?.(true)
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
