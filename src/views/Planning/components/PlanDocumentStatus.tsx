import { Awareness } from '@/components'
import { ComboBox } from '@/components/ui'
import { DocumentStatuses } from '@/defaults'
import { useRef } from 'react'
interface Status {
  name: string
  version: number
  documentId: string
}

export const PlanDocumentStatus = ({ status, setStatus }: {
  status?: Status
  setStatus: (newStatusName: string) => Promise<void>
}): JSX.Element => {
  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOption = DocumentStatuses.find(type => type.value === (status?.name || 'draft'))

  return (
    <Awareness name='PlanDocumentStatus' ref={setFocused}>
      <ComboBox
        className='h-9 w-9 p-0'
        options={DocumentStatuses}
        variant={'ghost'}
        selectedOption={selectedOption}
        onSelect={(option) => {
          console.log('setting to ', option.value)
          if (status?.version) {
            void setStatus(option.value)
          }
        }}
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
