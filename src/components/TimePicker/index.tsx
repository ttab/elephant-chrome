
import { ComboBox } from '../ui'
import { type DefaultValueOption } from '@/types/index'
import { CalendarFoldIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'
// import { useYObserver } from '@/hooks'
import { useYValue } from '@/hooks/useYValue'
import { Block } from '@/protos/service'
import { useRef } from 'react'


// import * as Y from 'yjs'


import { cn } from '@ttab/elephant-ui/utils'
import { as } from 'vitest/dist/chunks/reporters.C_zwCd4j.js'
import { time } from 'console'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const timeSlotTypes: DefaultValueOption[] = [
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


export const TimePicker = ({ index }: {
  index: number
}): JSX.Element => {

  // const { get, state, loading } = useYObserver('meta', path)
  // const { get, set } = useYObserver('meta', 'core/planning-item[0].data')
  // const base = `meta.core/assignment[${index}]`

  // const [publishTime] = useYValue<string>(`${base}.data.publish`)
  // const [inProgress] = useYValue(`${base}.__inProgress`)

  // const { get, set, loading } = useYObserver('meta', `core/assignment[${index}]/core/assignment`)
  // const { get, set, loading } = useYObserver('meta', `core/assignment/data`)

  // const { get: getInProgress } = useYObserver('meta', `core/assignment[${index}]`)


  // if (loading) {
  //   return <></>
  // }
  // const [publishTime] = useYValue<string>(`meta.core/assignment[${index}].data.publish`)
  // const [data, setData] = useYValue<Block>(`meta.core/assignment[${index}]`)

  // const [data, setData] = useYValue<Block>(`meta.core/assignment[${index}]`)
  // const d = data?.data

  // const [, setTimeData] = useYValue(`meta.core/assignment[${index}].data`)

  const [startDate] = useYValue<String>(`meta.core/planning-item[0].data.start_date`) as unknown as string
  const [endDate] = useYValue(`meta.core/planning-item[0].data.end_date`) as unknown as string

  const [fullDay, setFullDay] = useYValue(`meta.core/assignment[${index}].data.full_day`)
  const [end, setEnd] = useYValue(`meta.core/assignment[${index}].data.end`)
  const [start, setStart] = useYValue(`meta.core/assignment[${index}].data.start`)
  const [timeSlot, setTimeSlot] = useYValue<string>(`meta.core/assignment[${index}].data.slot`)

  console.log('XXX timeSlot', timeSlot)

  // data: {
  //   end_date: '2024-02-09',
  //   full_day: 'true',
  //   start_date: '2024-02-09',
  //   end: '2024-02-09T22:59:59Z',
  //   start: '2024-02-08T23:00:00Z',
  //   public: 'true',
  //   publish: '2024-02-09T10:30:00Z'
  // },


  const timeSlots:
    {
      name: string,
      timeSlotType: DefaultValueOption,
      slots: string[],
      median: string
    }[] = [
      {
        name: 'morning',
        timeSlotType: timeSlotTypes[1],
        slots: ['5', '6', '7', '8', '9'],
        median: '7'
      },
      {
        name: 'forenoon',
        timeSlotType: timeSlotTypes[2],
        slots: ['10', '11', '12', '13'],
        median: '11'
      },
      {
        name: 'afternoon',
        timeSlotType: timeSlotTypes[3],
        slots: ['14', '15', '16', '17'],
        median: '15'
      },
      {
        name: 'evening',
        timeSlotType: timeSlotTypes[4],
        slots: ['18', '19', '20', '21', '22', '23', '0', '1', '2', '3', '4'],
        median: '22'
      },
      {
        name: 'fullDay',
        timeSlotType: timeSlotTypes[0],
        slots: [],
        median: ''
      }
    ]

  const getTimeSlot = (timeSlot: string) => {
    return timeSlots.find(slot => slot.slots.includes(timeSlot))
  }

  const getMedianSlot = (slots: typeof timeSlots, value: string) => {
    const slot = slots.find(slot => slot.name === value)?.median
    return slot ? slot : ''
  }

  const selectedOption = timeSlotTypes.find(type => {

    if (fullDay === 'true' && type.value === 'fullDay') {
      return type
    } else {
      const ts = getTimeSlot(timeSlot as string)
      if (ts && ts.timeSlotType.value === type.value) {
        return type
      }
    }
  })

  const { className = '', ...iconProps } = selectedOption?.iconProps || {}

  const handleOnSelect = (option: DefaultValueOption) => {
    console.log('XXX selecxt', option)
    const { value } = option

    switch (value) {
      case 'fullDay':
        setFullDay(fullDay === 'true' ? 'false' : 'true')
        setTimeSlot(getMedianSlot(timeSlots, value))
        break;
      case 'morning':
        setFullDay('false')
        setTimeSlot(getMedianSlot(timeSlots, value))
        break;
      case 'forenoon':
        setFullDay('false')
        setTimeSlot(getMedianSlot(timeSlots, value))
        break;
      case 'afternoon':
        setFullDay('false')
        setTimeSlot(getMedianSlot(timeSlots, value))
        break;
      case 'evening':
        setFullDay('false')
        setTimeSlot(getMedianSlot(timeSlots, value))
        break;
      default:
        break;
    }
    // set(
    //   option.value === 'fullDay' ? 'true' : 'false',
    //   'full_day'
    // )

    // const times = Block.create({

    //   data: {
    //     ...d,
    //     full_day: option.value === 'fullDay' ? 'true' : 'false'
    //   }


    // })
    // setTimeData({
    //   ...d,
    //   full_day: option.value === 'fullDay' ? 'true' : 'false' })
  }

  // const handleOnSelect = (option: any) => {
  //   console.log('XXX option', option)
  // }

  return <ComboBox
    className='w-fit h-7'
    options={timeSlotTypes}
    variant={'ghost'}
    selectedOption={selectedOption}
    onSelect={handleOnSelect}


  >
    {selectedOption?.icon
      ? <div> <selectedOption.icon {...iconProps} className={cn('text-foreground', className)} /> {selectedOption?.label} </div>
      : <Clock10Icon {...iconProps} />
    }
  </ComboBox>

}