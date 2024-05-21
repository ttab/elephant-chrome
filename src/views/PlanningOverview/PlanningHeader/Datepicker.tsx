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
import { useRegistry } from '@/hooks'
import { cva } from 'class-variance-authority'


export const DatePicker = ({ date, setDate, forceYear = false }: {
  date: Date
  setDate: Dispatch<SetStateAction<Date>> | ((arg: Date) => void)
  forceYear?: boolean
}): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  const formattedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone
  }).format(date)

  const longFormattedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone
  }).format(date)

  const defaultDate = cva('', {
    variants: {
      forceYear: {
        true: 'hidden',
        false: '@3xl/view:hidden'
      }
    }
  })

  const longDate = cva('', {
    variants: {
      forceYear: {
        true: '',
        false: 'hidden @3xl/view:inline'
      }
    }
  })

  return (
    <Popover>
      <PopoverTrigger asChild>

        <Button
          variant={'ghost'}
          className={cn(
            'justify-center text-left font-normal h-9 whitespace-nowrap px-0 sm:px-4',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon size={18} strokeWidth={1.75} className='mr-2' />

          <span className={cn(defaultDate({ forceYear }))}>{formattedDate}</span>
          <span className={cn(longDate({ forceYear }))}>{longFormattedDate}</span>
        </Button>

      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
          initialFocus
        />
      </PopoverContent>
    </Popover>

  )
}
