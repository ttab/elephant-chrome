import { useYObserver } from '@/hooks'
import { AssignmentTypes } from '@/defaults'
import { ComboBox } from '../ui'
import { cn } from '@ttab/elephant-ui/utils'

export const AssignmentType = ({ index }: { index: number }): JSX.Element => {
  const { get, set, loading } = useYObserver('meta', `core/assignment[${index}].meta.core/assignment-type[0]`)

  const selectedOption = AssignmentTypes.find(type => type.value === get('value'))

  return !loading
    ? <ComboBox
        className='w-fit px-2 h-7'
        options={AssignmentTypes}
        variant={'ghost'}
        selectedOption={selectedOption}
        onSelect={(option) => { set(option.value, 'value') }}
    >
      {selectedOption?.icon
        ? <selectedOption.icon
            {...selectedOption.iconProps}
            className={cn('text-foreground', selectedOption.iconProps)} />
        : selectedOption?.label
      }
    </ComboBox>
    : <span>Loading...</span>
}
