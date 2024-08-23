
import { ComboBox } from '../ui'
import { type DefaultValueOption } from '@/types/index'
import { CalendarFoldIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'
// import { useYObserver } from '@/hooks'
import { useYValue } from '@/hooks/useYValue'
import { Block } from '@/protos/service'
import { useRef } from 'react'


// import * as Y from 'yjs'


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




  // data: {
  //   end_date: '2024-02-09',
  //   full_day: 'true',
  //   start_date: '2024-02-09',
  //   end: '2024-02-09T22:59:59Z',
  //   start: '2024-02-08T23:00:00Z',
  //   public: 'true',
  //   publish: '2024-02-09T10:30:00Z'
  // },

  const timeSlots = (sd = startDate, ed = endDate) => {
    return {
      morning: {
        timeSlotType: TimeSlotTypes[1],
        start: `${sd}T05:00:00`,
        end: `${ed}T09:59:59`
      },
      forenoon: {
        timeSlotType: TimeSlotTypes[2],
        start: `${sd}T10:00:00`,
        end: `${ed}T13:59:59`
      },
      afternoon: {
        timeSlotType: TimeSlotTypes[3],
        start: `${sd}T14:00:00`,
        end: `${ed}T17:59:59`
      },
      evening: {
        timeSlotType: TimeSlotTypes[4],
        start: `${sd}T18:00:00`,
        end: `${ed}T04:59:59?`
      },
      fullday: {
        timeSlotType: TimeSlotTypes[0],
        start: `${sd}T00:00:00`,
        end: `${ed}T23:59:59`
      }
    }
  }

  const getTimeSlot = (start: string, end: string) =>  {
    const values = Object.values(timeSlots()) as [{timeSlotType: DefaultValueOption, start: string, end: string }]
    return values.find(slot => {
      console.log('XXX start', slot.start, start)
      console.log('XXX end', slot.end, end)

      slot.start === start && slot.end === end
  })

  }

  const selectedOption = TimeSlotTypes.find(type => {

    if (fullDay === 'true' && type.value === 'fullDay') {
      return type
    } else {
      const ts = getTimeSlot(start as string, end as string)
      if (ts && ts.timeSlotType.value === type.value) {
        return type
      }
    }


  })

  const { className = '', ...iconProps } = selectedOption?.iconProps || {}

  // const handleOnSelect = (): (option: DefaultValueOption) => void => {
  //   return (option) => {
  //   }
  // }

  const handleOnSelect = (option: DefaultValueOption) => {
    console.log('XXX selecxt', option)
    const { value } = option

    switch (value) {
      case 'fullDay':
        setFullDay(fullDay === 'true' ? 'false' : 'true')
        break;
      case 'morning':

        const start = new Date(`${startDate}T05:00:00`)
        const startString = start.toISOString()
        const end = new Date(`${endDate}T09:59:59`)
        const endString = end.toISOString()
        setFullDay('false')
        setStart(startString)
        setEnd(endString)
        break;
      case 'forenoon':
        break;
      case 'afternoon':
        break;
      case 'evening':
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
    options={TimeSlotTypes}
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