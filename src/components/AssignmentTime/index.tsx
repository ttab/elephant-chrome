

import { CalendarFoldIcon, CalendarClockIcon, Clock1Icon, Clock2Icon, Clock3Icon, Clock4Icon, Clock5Icon, Clock6Icon, Clock7Icon, Clock8Icon, Clock9Icon, Clock10Icon, Clock11Icon, Clock12Icon } from '@ttab/elephant-ui/icons'
// import { useYObserver } from '@/hooks'
import { useYValue } from '@/hooks/useYValue'
import { Block } from '@/protos/service'
import { TimeDeliveryMenu } from './TimeDeliveryMenu'
import { cn } from '@ttab/elephant-ui/utils'
import { AssignmentValueOption } from './types'
import { ExcecutionTimeMenu } from './ExcecutionTimeMenu'

const iconProps = {
  size: 18,
  strokeWidth: 1.75,
  className: 'text-muted-foreground'
}

export const timeSlotTypes: AssignmentValueOption[] = [
  {
    label: 'Heldag',
    value: 'fullday',
    icon: CalendarFoldIcon,
    iconProps,
    slots: []
  },
  {
    label: 'Morgon',
    value: 'morning',
    icon: Clock5Icon,
    iconProps,
    slots: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    median: '7'
  },
  {
    label: 'Förmiddag',
    value: 'forenoon',
    icon: Clock10Icon,
    iconProps,
    slots: ['10', '11', '12', '13'],
    median: '11'
  },
  {
    label: 'Eftermiddag',
    value: 'afternoon',
    icon: Clock2Icon,
    iconProps,
    slots: ['14', '15', '16', '17'],
    median: '15'
  },
  {
    label: 'Kväll',
    value: 'evening',
    icon: Clock6Icon,
    iconProps,
    slots: ['18', '19', '20', '21', '22', '23'],
    median: '21'
  }
]

export const timePickTypes: AssignmentValueOption[] = [
  {
    label: 'Välj tid',
    value: 'endexcecution',
    icon: CalendarClockIcon,
    iconProps
  },
  {
    label: 'Välj tid',
    value: 'start-end-excecution',
    icon: CalendarClockIcon,
    iconProps
  }
]

const getTimeSlot = (timeSlot: string) => {
  return timeSlotTypes.find(type => type.slots?.includes(timeSlot))
}

const getMedianSlot = (slots: AssignmentValueOption[], value: string) => {
  const slotMedian = slots.find(slot => slot.value === value)?.median
  return slotMedian ? slotMedian : -1
}

const getMidnightISOString = (endDate: string) => {

  const endDateString = `${endDate}T00:00:00`
  const endDateIsoString = (new Date(endDateString)).toISOString()
  return endDateIsoString
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
  const { full_day: fullDay, end, publish_slot: publishSlot, end_date: endDate, start_date: startDate } = data || {}
  // const [ass] = useYValue<AssignmentData>(`meta.core/assignment[${index}]`)

  let selectedLabel = ''
  timeSlotTypes.concat(timePickTypes)
  const selectedOption = timeSlotTypes.concat(timePickTypes).find(option => {
    if (fullDay === 'true' && option.value === 'fullday') {
      selectedLabel = option.label
      return option
    } else if (end && option.value === 'endexcecution') {

      const aDate = new Date(end.toString())
      selectedLabel = aDate.toLocaleString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      return option
    }
    else if (publishSlot) {
      const ts = getTimeSlot(publishSlot)
      if (ts && ts.value === option.value) {
        selectedLabel = option.label
        return option
      }
    }
  })

  const { className = '', ...iconProps } = selectedOption?.iconProps || {}

  const handleOnSelect = ({ value, selectValue }: { value: string, selectValue: string }) => {
    switch (value) {
      case 'fullday':

        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'true',
            start_date: data?.start_date,
            // end: getEndDateTimeISOString(endDate as string, 23),
            start: getMidnightISOString(endDate as string),
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
            publish_slot: (getMedianSlot(timeSlotTypes, value)) + '',
            // end: getEndDateTimeISOString(endDate as string, 23),
            start: getMidnightISOString(endDate as string),
          }
        }).data)
        break;

      case 'endexcecution':
        const endDateString = `${endDate}T${selectValue}`
        const endDateIsoString = new Date(endDateString).toISOString()
        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'false',
            start_date: data?.start_date,
            end: endDateIsoString,
            start: getMidnightISOString(endDate as string),
            public: data?.public,
            publish: data?.publish,
          }
        }).data)
        break;
      case 'start-end-excecution':
        const startDateString = `${endDate}T${selectValue}`
        const startDateIsoString = new Date(startDateString).toISOString()
        console.log('start-end-excecution', startDateIsoString)
        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'false',
            start_date: data?.start_date,
            // end: endDateIsoString,
            start: startDateIsoString,
            public: data?.public,
            publish: data?.publish,
          }
        }).data)
        break;
      default:

        break;
    }
  }

  const onExcecutionTimeSelect = (
    {excecutionStart, executionEnd}:
    {excecutionStart: string | undefined, executionEnd: string | undefined}) => {
    const block = Block.create({
      data: {
        end_date: data?.end_date,
        full_day: 'false',
        start_date: data?.start_date,
        end: executionEnd,
        start: excecutionStart,
        public: data?.public,
        publish: data?.publish,
      }
    })

    if (!excecutionStart) {delete block.data.start}
    if (!executionEnd) { delete block.data.end}

    setData(block.data)
  }

  return (

    (assignmentType && assignmentType === 'picture') ?
      (<ExcecutionTimeMenu handleOnSelect={onExcecutionTimeSelect} index={index} startDate={startDate as string}/>)

      : (<TimeDeliveryMenu
        handleOnSelect={handleOnSelect}
        className='w-fit text-muted-foreground font-sans font-normal text-ellipsis px-2 h-7'
        selectedOption={selectedOption}
        index={index}

      >
        {selectedOption?.icon
          ? <div className='flex flex-row p-1'><selectedOption.icon {...iconProps} className={cn('text-foreground', className)} /><div className='pl-1'>{selectedLabel}</div></div>
          : <CalendarFoldIcon size={18} strokeWidth={1.75} className={'text-muted-foreground'} />
        }
      </TimeDeliveryMenu>)

  )
}