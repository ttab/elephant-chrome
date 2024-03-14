import { useYObserver } from '@/hooks'
import { AssignmentTypes } from '@/defaults'
import { ComboBox } from '../ui'

export const AssignmentType = ({ index }: { index: number }): JSX.Element => {
  const { get, set, loading } = useYObserver('planning', `meta.core/assignment[${index}].meta.core/assignment-type[0]`)

  const selectedOption = AssignmentTypes.find(type => type.value === get('value'))

  return !loading
    ? <ComboBox
        size='xs'
        className='w-fit text-muted-foreground font-sans font-normal whitespace-nowrap text-ellipsis px-2 h-7'
        options={AssignmentTypes}
        variant={'ghost'}
        selectedOption={selectedOption}
        placeholder='Assignment type'
        onSelect={(option) => { set(option.value, 'value') }}
    >
      {selectedOption?.icon
        ? <selectedOption.icon size={16} strokeWidth={1.75}/>
        : selectedOption?.label
      }
    </ComboBox>
    : <span>Loading...</span>
}
