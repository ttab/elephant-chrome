'use client'

import { type Dispatch, type SetStateAction } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

import { Calendar as CalendarIcon } from '@ttab/elephant-ui/icons'

import { cn } from '@ttab/elephant-ui/utils'
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'

interface DatePickerProps {
  date: Date
  setDate: Dispatch<SetStateAction<Date>>
}

export const DatePicker = ({ date, setDate }: DatePickerProps): JSX.Element => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'ghost'}
          className={cn(
            'justify-start text-center font-normal h-8 w-36',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'EEE d MMM', { locale: sv }) : ''}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => selectedDate &&
            setDate(selectedDate)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
