import { Awareness } from '@/components'
import { ComboBox } from '@ttab/elephant-ui'
import { DocumentStatuses } from '@/defaults'
import { useRef } from 'react'
import { type Status } from '@/hooks/useDocumentStatus'

export const DocumentStatus = ({ status, setStatus }: {
  status?: Status
  setStatus: (newStatusName: string) => Promise<void>
}): JSX.Element => {
  const setFocused = useRef<(value: boolean) => void>(null)
  const selectedOptions = DocumentStatuses.filter(type => type.value === (status?.name || 'draft'))


  const SelectedIcon = selectedOptions[0].icon
  return (
    <Awareness name='DocumentStatus' ref={setFocused}>
      <ComboBox
        max={1}
        className='h-9 w-9 p-0'
        options={DocumentStatuses}
        variant={'ghost'}
        selectedOptions={selectedOptions}
        onSelect={(option) => {
          void setStatus(option.value)
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
