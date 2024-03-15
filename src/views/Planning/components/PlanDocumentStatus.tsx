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
    placeholder='Document status'
    onSelect={() => { alert('Not yet implemented') }}
    hideInput
    >
    {selectedOption?.icon
      ? <selectedOption.icon
          fill='#4675C8'
          color='#ffffff'
          className='size-4 bg-[#4675C8] rounded-full'
          strokeWidth={1.75}
  />
      : selectedOption?.label
      }
  </ComboBox>
}
