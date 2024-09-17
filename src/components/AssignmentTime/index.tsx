
import { type DefaultValueOption } from '@/types/index'
import { CalendarFoldIcon, CalendarClockIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'
// import { useYObserver } from '@/hooks'
import { useYValue } from '@/hooks/useYValue'
import { useState, useRef, useEffect } from 'react'
import { Block } from '@/protos/service'
import { TimeMenu } from './TimeMenu'
import { cn } from '@ttab/elephant-ui/utils'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const timeSlotTypes: DefaultValueOption[] = [
  {
    label: 'Heldag',
    value: 'fullday',
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

export const timePickTypes: DefaultValueOption[] = [
  {
    label: 'Välj tid',
    value: 'timestamp',
    icon: CalendarClockIcon,
    iconProps
  }
]

export const timeSlots:
  {
    name: string,
    timeSlotType: DefaultValueOption,
    slots?: string[],
    median?: string
  }[] = [
    {
      name: 'morning',
      timeSlotType: timeSlotTypes[1],
      slots: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
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
      slots: ['18', '19', '20', '21', '22', '23'],
      median: '21'
    },
    {
      name: 'fullday',
      timeSlotType: timeSlotTypes[0]
    },
    {
      name: 'timestamp',
      timeSlotType: timePickTypes[0]
    }
  ]

const getTimeSlot = (timeSlot: string) => {
  return timeSlots.find(slot => slot.slots?.includes(timeSlot))
}

const getMedianSlot = (slots: typeof timeSlots, value: string) => {
  const slot = slots.find(slot => slot.name === value)?.median
  return slot ? slot : -1
}

const getMidnightISOString = (endDate: string) => {

    const endDateString = `${endDate}T00:00:00`
    const endDateIsoString = (new Date(endDateString)).toISOString()
    console.log('XXX endDateString', endDateIsoString)
    return endDateIsoString
}

const getEndDateTimeISOString = (endDate: string, hours: number) => {
  const newDate = new Date(endDate)
  newDate.setHours(hours, 59, 59)
  const hoursString = newDate.toISOString()
  console.log('XXX hours string', hoursString)
  return hoursString
}

export interface AssignmentData {
  end_date?: string
  full_day?: string
  start_date?: string
  end?: string
  start?: string
  public?: string
  publish?: string
  publish_slot?: string
}

export const AssignmentTime = ({ index }: {
  index: number
}): JSX.Element => {
  // if (loading) {
  //   return <></>
  // }

  const [assignmentType] = useYValue<string>(`meta.core/assignment[${index}].meta.core/assignment-type[0].value`)
  const [data, setData] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)
  const { full_day: fullDay, end, publish_slot: publishSlot, end_date: endDate } = data || {}
  const [ass] = useYValue<AssignmentData>(`meta.core/assignment[${index}]`)
  console.log('XXX ass', ass)

  let selectedLabel = ''
  timeSlotTypes.concat(timePickTypes)
  const selectedOption = timeSlotTypes.concat(timePickTypes).find(option => {
    if (fullDay === 'true' && option.value === 'fullday') {
      selectedLabel = option.label
      return option
    } else if (end && option.value === 'timestamp') {

      const aDate = new Date(end.toString())
      selectedLabel = aDate.toLocaleString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      return option
    }
    else if (publishSlot) {
      const ts = getTimeSlot(publishSlot)
      if (ts && ts.timeSlotType.value === option.value) {
        selectedLabel = option.label
        return option
      }
    }
  })

  const { className = '', ...iconProps } = selectedOption?.iconProps || {}

  const handleOnSelect = ({ value, selectValue }: { value: string, selectValue: string }) => {
    switch (value) {
      case 'fullday':

        setData( Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'true',
            start_date: data?.start_date,
            // end: getEndDateTimeISOString(endDate as string, 23),
            // start: getMidnightISOString(endDate as string),
            public: data?.public,
            publish: data?.publish,
          }
        }).data)
        break;
      case 'morning':
      case 'forenoon':
      case 'afternoon':
      case 'evening':
        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'false',
            start_date: data?.start_date,
            public: data?.public,
            publish: data?.publish,
            publish_slot: (getMedianSlot(timeSlots, value)) + '',
            // end: getEndDateTimeISOString(endDate as string, 23),
            // start: getMidnightISOString(endDate as string),
          }
        }).data)
        break;

      case 'timestamp':
        const endDateString = `${endDate}T${selectValue}`
        const endDateIsoString = new Date(endDateString).toISOString()
        console.log('XXX timestamp', endDateIsoString)
        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'false',
            start_date: data?.start_date,
            end: endDateIsoString,
            start: data?.start,
            public: data?.public,
            publish: data?.publish,
          }
        }).data)
        break;
      default:

        break;
    }
  }

  return (
    <TimeMenu
      handleOnSelect={handleOnSelect}
      className='w-fit text-muted-foreground font-sans font-normal text-ellipsis px-2 h-7'
      selectedOption={selectedOption}
      index={index}

    >
      {selectedOption?.icon
        ? <div><selectedOption.icon {...iconProps} className={cn('text-foreground', className)} />{selectedLabel} </div>
        : <CalendarFoldIcon size={18} strokeWidth={1.75} className={'text-muted-foreground'} />
      }
    </TimeMenu>
  )
}