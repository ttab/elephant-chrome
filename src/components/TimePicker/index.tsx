
import { ComboBox } from '../ui'
import { type DefaultValueOption } from '@/types/index'
import {CalendarFoldIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon} from '@ttab/elephant-ui/icons'
import { useYObserver } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const TimeSlotTypes: DefaultValueOption[] = [
  {
    label: 'Heldag',
    value: 'fullDay',
    icon: CalendarFoldIcon,
    iconProps
  },
  {
    label: 'Morgon',
    value: 'morning',
    icon: Clock5Icon,
    iconProps
  },
  {
    label: 'Förmiddag',
    value: 'forenoon',
    icon: Clock10Icon,
    iconProps
  },
  {
    label: 'Eftermiddag',
    value: 'afternoon',
    icon: Clock2Icon,
    iconProps
  },
  {
    label: 'Kväll',
    value: 'evening',
    icon: Clock6Icon,
    iconProps
  }
]


export const TimePicker = ({ path, editable = false }: {
  path: string
  editable?: boolean
}): JSX.Element => {

  const { get, state, loading } = useYObserver('meta', path)

  if (loading) {
    return <></>
  }

  const value = state?.map ? state.map((s) => s.data.start).sort().join('/') : ''

  const selectedOption = TimeSlotTypes.find(type => type.value === value)

  const { className = '', ...iconProps } = selectedOption?.iconProps || {}
  const handleOnSelect = (get: (key: string) => unknown): (option: DefaultValueOption) => void => {
    return (option) => {
    }
  }

return <ComboBox
    className='w-fit h-7'
    options={TimeSlotTypes}
    variant={'ghost'}
    selectedOption={selectedOption}
    onSelect={handleOnSelect(get)}

  >
    {selectedOption?.icon
      ? <div> <selectedOption.icon {...iconProps} className={cn('text-foreground', className)} /> {selectedOption?.label} </div>
      : <Clock10Icon {...iconProps}/>
    }
  </ComboBox>

}