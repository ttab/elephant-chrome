import { useRef } from 'react'
import { ComboBox } from '@/components/ui'
import { VisibilityStatuses } from '@/defaults'
import { useYObserver } from '@/hooks'
import { Awareness } from '@/components'

export const PlanStatus = (): JSX.Element => {
  const { get, set, loading } = useYObserver('planning', 'meta.core/planning-item[0].data')

  const setFocused = useRef<(value: boolean) => void>(null)

  const selectedOption = VisibilityStatuses.find(type => {
    const value = get('public') === 'true' ? 'public' : 'internal'

    return type.value === value
  })

  return !loading
    ? (
      <Awareness name='PlanStatus' ref={setFocused}>
        <ComboBox
          className='w-fit px-2 h-7'
          options={VisibilityStatuses}
          variant={'ghost'}
          selectedOption={selectedOption}
          onOpenChange={(isOpen: boolean) => {
            if (setFocused?.current) {
              setFocused.current(isOpen)
            }
          }}
          onSelect={(option) => set(option.value === 'public'
            ? 'true'
            : 'false',
          'public') }
          hideInput
        >
          {selectedOption?.icon
            ? <selectedOption.icon { ...selectedOption.iconProps} />

            : selectedOption?.label
      }
        </ComboBox>
      </Awareness>
      )
    : <p>Loading...</p>
}
