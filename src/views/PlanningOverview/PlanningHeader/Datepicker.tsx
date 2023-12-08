import { type Dispatch, type SetStateAction } from 'react'

import { Calendar as CalendarIcon } from '@ttab/elephant-ui/icons'

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { useRegistry } from '@/contexts/RegistryProvider'

interface DatePickerProps {
  date: Date
  setDate: Dispatch<SetStateAction<Date>>
}

export const DatePicker = ({ date, setDate }: DatePickerProps): JSX.Element => {
  const { locale, timeZone } = useRegistry()
  const formattedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone
  }).format(date)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'ghost'}
          className={cn(
            'justify-center text-left font-normal h-8 w-36',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {formattedDate}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={(selectedDate) => selectedDate &&
            setDate(selectedDate)}
          initialFocus
        />
      </PopoverContent>
    </Popover>

  )
}
