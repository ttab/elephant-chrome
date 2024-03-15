import { ComboBox } from '@/components/ui'
import { DocumentStatuses } from '@/defaults'

// TODO: Should read current versions status
export const PlanDocumentStatus = (): JSX.Element => {
  const selectedOption = DocumentStatuses.find(type => type.value === 'published')

  return <ComboBox
    size='xs'
    className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
    options={DocumentStatuses}
    variant={'ghost'}
    selectedOption={selectedOption}
    onSelect={() => { alert('Not yet implemented') }}
    hideInput
    >
    {selectedOption?.icon
      ? <selectedOption.icon { ...selectedOption.iconProps }
  />
      : selectedOption?.label
      }
  </ComboBox>
}
