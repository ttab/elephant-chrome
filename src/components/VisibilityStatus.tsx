import { useRef } from 'react'
import { ComboBox } from '@ttab/elephant-ui'
import { VisibilityStatuses } from '@/defaults'
import { useYValue } from '@/hooks'
import { Awareness } from '@/components'
import { Block } from '@/protos/service'

export const VisibilityStatus = (): JSX.Element => {
  const [status, setStatus] = useYValue<Block | undefined>('meta.core/planning-item[0]')

  const setFocused = useRef<(value: boolean) => void>(null)

  const selectedOptions = VisibilityStatuses.filter(type => {
    const value = status?.data.public === 'true' ? 'public' : 'internal'

    return type.value === value
  })

  const SelectedIcon = selectedOptions[0].icon

  return (
    <Awareness name='PlanStatus' ref={setFocused}>
      <ComboBox
        max={1}
        size='sm'
        variant={'ghost'}
        options={VisibilityStatuses}
        selectedOptions={selectedOptions}
        onOpenChange={(isOpen: boolean) => {
          if (setFocused?.current) {
            setFocused.current(isOpen)
          }
        }}
        onSelect={(option) => {
          setStatus(Block.create({
            type: 'core/planning-item',
            ...status,
            data: {
              ...status?.data,
              public: option.value === 'public'
                ? 'true'
                : 'false'
            },
            links: [],
            meta: [],
            content: []
          }))
        }}
        hideInput
      >
        {SelectedIcon
          ? <SelectedIcon { ...selectedOptions[0].iconProps } />
          : selectedOptions[0].label
          }
      </ComboBox>
    </Awareness>
  )
}
