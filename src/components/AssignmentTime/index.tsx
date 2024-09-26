import { CalendarFoldIcon } from '@ttab/elephant-ui/icons'
import { useYValue } from '@/hooks/useYValue'
import { Block } from '@/protos/service'
import { TimeDeliveryMenu } from './TimeDeliveryMenu'
import { cn } from '@ttab/elephant-ui/utils'
import { type AssignmentValueOption, type AssignmentData } from './types'
import { ExcecutionTimeMenu } from './ExcecutionTimeMenu'
import { timeSlotTypes, timePickTypes } from './constants'

const getTimeSlot = (timeSlot: string): AssignmentValueOption | undefined => {
  return timeSlotTypes.find(type => type.slots?.includes(timeSlot))
}

const getMedianSlot = (slots: AssignmentValueOption[], value: string): string => {
  const slotMedian = slots.find(slot => slot.value === value)?.median
  return slotMedian || '-1'
}

const getMidnightISOString = (endDate: string): string => {
  const endDateString = `${endDate}T00:00:00`
  const endDateIsoString = (new Date(endDateString)).toISOString()
  return endDateIsoString
}

export const AssignmentTime = ({ index }: {
  index: number
}): JSX.Element => {
  const [assignmentType] = useYValue<string>(`meta.core/assignment[${index}].meta.core/assignment-type[0].value`)
  const [data, setData] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)
  const { full_day: fullDay, end, publish_slot: publishSlot, end_date: endDate, start_date: startDate } = data || {}

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

  const handleOnSelect = ({ value, selectValue }: { value: string, selectValue: string }): void => {
    switch (value) {
      case 'fullday':

        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'true',
            start_date: data?.start_date,
            start: getMidnightISOString(endDate as string),
            public: data?.public,
            publish: data?.publish
          }
        }).data)
        break
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
            start: getMidnightISOString(endDate as string)
          }
        }).data)
        break

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
            publish: data?.publish
          }
        }).data)
        break
      case 'start-end-excecution':
        const startDateString = `${endDate}T${selectValue}`
        const startDateIsoString = new Date(startDateString).toISOString()
        console.log('start-end-excecution', startDateIsoString)
        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'false',
            start_date: data?.start_date,
            start: startDateIsoString,
            public: data?.public,
            publish: data?.publish
          }
        }).data)
        break
      default:

        break
    }
  }

  const onExcecutionTimeSelect = (
    { excecutionStart, executionEnd }: { excecutionStart: string | undefined, executionEnd: string | undefined }) => {
    const block = Block.create({
      data: {
        end_date: data?.end_date,
        full_day: 'false',
        start_date: data?.start_date,
        end: executionEnd,
        start: excecutionStart,
        public: data?.public,
        publish: data?.publish
      }
    })

    if (!excecutionStart) { delete block.data.start }
    if (!executionEnd) { delete block.data.end }

    setData(block.data)
  }

  return (
    (assignmentType && assignmentType === 'picture')
      ? (<ExcecutionTimeMenu handleOnSelect={onExcecutionTimeSelect} index={index} startDate={startDate as string} />)
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
