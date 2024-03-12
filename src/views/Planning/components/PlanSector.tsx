import { ComboBox } from '@/components/ui'
import { Sectors } from '@/defaults'
import { useYObserver } from '@/hooks'

export const PlanSector = (): JSX.Element | undefined => {
  const { get, set, loading } = useYObserver('planning', 'links.tt/sector[0]')

  const selectedOption = Sectors.find(c => c.value === get('title'))

  return !loading
    ? <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={Sectors}
        selectedOption={selectedOption}
        placeholder={selectedOption?.label || 'Add Sector'}
        onSelect={(option) => {
          set(option.payload)
        }}
      />
    : undefined
}
