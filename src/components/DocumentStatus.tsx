import { ComboBox } from '@ttab/elephant-ui'
import { DocumentStatuses } from '@/defaults'
import { type Status } from '@/hooks/useDocumentStatus'

export const DocumentStatus = ({ status, setStatus }: {
  status?: Status
  setStatus: (newStatusName: string) => Promise<void>
}): JSX.Element => {
  const selectedOptions = DocumentStatuses.filter((type) => type.value === (status?.name || 'draft'))
  const SelectedIcon = selectedOptions[0].icon

  return (
    <ComboBox
      max={1}
      size='sm'
      options={DocumentStatuses}
      variant='ghost'
      selectedOptions={selectedOptions}
      onSelect={(option) => {
        if (status?.version !== undefined) {
          void setStatus(option.value)
        }
      }}
    >
      {SelectedIcon
        ? <SelectedIcon {...selectedOptions[0].iconProps} />
        : selectedOptions[0].label}
    </ComboBox>
  )
}
