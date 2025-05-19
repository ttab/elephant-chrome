import { Clock5 } from '@ttab/elephant-ui/icons'
import { useYValue } from '@/hooks/useYValue'
import { Block } from '@ttab/elephant-api/newsdoc'
import { TimeDeliveryMenu } from './TimeDeliveryMenu'
import { type AssignmentValueOption, type AssignmentData } from './types'
import { ExecutionTimeMenu } from './ExecutionTimeMenu'
import { timeSlotTypes, timePickTypes } from '../../defaults/assignmentTimeConstants'
import type { FormProps } from '../Form/Root'

const getTimeSlot = (timeSlot: string): AssignmentValueOption | undefined => {
  return timeSlotTypes.find((type) => type.slots?.includes(timeSlot))
}

const getMedianSlot = (slots: AssignmentValueOption[], value: string): string => {
  const slotMedian = slots.find((slot) => slot.value === value)?.median
  return slotMedian || '-1'
}

const getMidnightISOString = (endDate: string | undefined): string => {
  const endDateString = `${endDate}T00:00:00`
  const endDateIsoString = (new Date(endDateString)).toISOString()
  return endDateIsoString
}

export const AssignmentTime = ({ index, onChange }: {
  index: number
} & FormProps): JSX.Element => {
  const [assignmentType] = useYValue<string>(`meta.core/assignment[${index}].meta.core/assignment-type[0].value`)
  const [data, setData] = useYValue<AssignmentData>(`meta.core/assignment[${index}].data`)
  const { full_day: fullDay, end, publish_slot: publishSlot, end_date: endDate, start_date: startDate } = data || {}

  let selectedLabel = ''
  const selectedOption = timeSlotTypes.concat(timePickTypes).find((option) => {
    if (fullDay === 'true' && option.value === 'fullday') {
      selectedLabel = option.label
      return true
    } else if (end && option.value === 'endexecution') {
      const aDate = new Date(end.toString())

      selectedLabel = aDate.toLocaleString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })

      return true
    } else if (publishSlot) {
      const ts = getTimeSlot(publishSlot)

      if (ts && ts.value === option.value) {
        selectedLabel = option.label
        return true
      }
    }

    return false
  })

  const { className = '', ...iconProps } = selectedOption?.iconProps || {}

  /**
   *
   * Used for setting times in text, flash, editorial-info, graphic assignment types
   */

  const handleOnSelect = ({ value, selectValue }: { value: string, selectValue: string }): void => {
    switch (value) {
      case 'fullday':
        onChange?.(true)

        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'true',
            start_date: data?.start_date,
            start: getMidnightISOString(endDate),
            public: data?.public,
            ...(data?.publish && { publish: data.publish })
          }
        }).data)
        break
      case 'morning':
      case 'forenoon':
      case 'afternoon':
      case 'evening': {
        onChange?.(true)

        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'false',
            start_date: data?.start_date,
            public: data?.public,
            publish_slot: (getMedianSlot(timeSlotTypes, value)) + '',
            start: getMidnightISOString(endDate)
          }
        }).data)
        if (data?.publish) {
          delete data?.publish
        }
      }
        break

      case 'endexecution': {
        const endValue = new Date(`${endDate}T${selectValue}`).toISOString()

        onChange?.(true)

        setData(Block.create({
          data: {
            end_date: data?.end_date,
            full_day: 'false',
            start_date: data?.start_date,
            end: endValue,
            start: assignmentType && ['text', 'flash', 'editorial-info'].includes(assignmentType) ? endValue : getMidnightISOString(endDate),
            public: data?.public,
            ...(data?.publish && { publish: data.publish })
          }
        }).data)
      }
        break
      default:
        break
    }
  }

  /**
   *
   * Used for setting time in picture or video assignments
   */

  const onExecutionTimeSelect = (
    { executionStart, executionEnd }: { executionStart: string | undefined, executionEnd: string | undefined }): void => {
    const block = Block.create({
      data: {
        end_date: data?.end_date,
        full_day: 'false',
        start_date: data?.start_date,
        end: executionEnd,
        start: executionStart,
        public: data?.public,
        ...(data?.publish && { publish: data.publish })
      }
    })

    if (!executionStart) {
      delete block.data.start
    }

    if (!executionEnd) {
      delete block.data.end
    }

    setData(block.data)
  }

  return (
    (assignmentType && (assignmentType === 'picture' || assignmentType === 'video'))
      ? (<ExecutionTimeMenu handleOnSelect={onExecutionTimeSelect} index={index} startDate={startDate} />)
      : (
          <TimeDeliveryMenu
            handleOnSelect={handleOnSelect}
            className='w-fit font-sans font-normal text-ellipsis px-2 h-7'
            index={index}
            assignmentType={assignmentType}
          >
            {selectedOption?.icon
              ? (
                  <div className='flex flex-row p-1'>
                    <selectedOption.icon {...iconProps} className={className} />
                    <div className='pl-1'>{selectedLabel}</div>
                  </div>
                )
              : <Clock5 size={18} strokeWidth={1.75} className='text-muted-foreground' />}
          </TimeDeliveryMenu>
        )
  )
}
