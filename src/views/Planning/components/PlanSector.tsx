import { ComboBox } from '@/components/ui'
import { Sectors } from '@/defaults'
import { useYObserver } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'

export const PlanSector = (): JSX.Element | undefined => {
  const { get, set, loading } = useYObserver('planning', 'links.tt/sector[0]')

  const selectedOption = Sectors.find(c => c.value === get('title'))

  const placeholder = selectedOption?.label || 'Add Sector'

  return !loading
    ? <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={Sectors}
        selectedOption={selectedOption}
        placeholder={placeholder}
        onSelect={(option) => {
          set(option.payload)
        }}
      >
      {selectedOption?.color && <div className={cn('h-2 w-2 rounded-full mr-2', selectedOption?.color)} /> }
      {selectedOption ? <>{selectedOption.label}</> : <>{placeholder}</>}
    </ComboBox>
    : undefined
}
