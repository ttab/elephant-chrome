import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { DocumentStatuses } from '@/defaults'
import { useRef } from 'react'

// TODO: Should read current versions status
export const PlanDocumentStatus = (): JSX.Element => {
  const setFocused = useRef<(value: boolean) => void>(null)

  const selectedOption = DocumentStatuses.find(type => type.value === 'published')

  return (
    <Awareness name='PlanDocumentStatus' ref={setFocused}>
      <ComboBox
        className='h-9 w-9 p-0'
        options={DocumentStatuses}
        variant={'ghost'}
        selectedOption={selectedOption}
        onSelect={() => { alert('Not yet implemented') }}
        hideInput
      >
        {selectedOption?.icon
          ? <selectedOption.icon {...selectedOption.iconProps}
          />
          : selectedOption?.label
        }
      </ComboBox>
    </Awareness>
  )
}
