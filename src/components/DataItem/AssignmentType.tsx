import { useYObserver } from '@/hooks'
import { AssignmentTypes } from '@/defaults'
import { ComboBox } from '../ui'
import { cn } from '@ttab/elephant-ui/utils'

export const AssignmentType = ({ path, editable = true }: {
  path: string
  editable?: boolean
}): JSX.Element => {
  const { get, set, loading } = useYObserver('meta', path)

  const selectedOption = AssignmentTypes.find(type => type.value === get('value'))
  const { className = '', ...iconProps } = selectedOption?.iconProps || {}

  if (editable && !loading) {
    return <>
      {selectedOption?.icon
        ? <selectedOption.icon {...iconProps} className={cn('text-foreground', className)} />
        : selectedOption?.label
      }
    </>
  }

  return !loading
    ? <ComboBox
        className='w-fit px-2 h-7'
        options={AssignmentTypes}
        variant={'ghost'}
        selectedOption={selectedOption}
        onSelect={(option) => { set(option.value, 'value') }}
      >
      {selectedOption?.icon
        ? <selectedOption.icon {...iconProps} className={cn('text-foreground', className)} />
        : selectedOption?.label
      }
    </ComboBox>
    : <span>Loading...</span>
}
