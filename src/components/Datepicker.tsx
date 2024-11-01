import { type Dispatch, type SetStateAction, type MouseEvent } from 'react'

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
import { format } from 'date-fns'
import { type ViewProps } from '../types'

export const DatePicker = ({ date, changeDate, setDate, forceYear = false }: {
  date: Date
  changeDate?: (event: MouseEvent<Element> | KeyboardEvent | undefined, props: ViewProps, target?: 'self') => void
  setDate?: Dispatch<SetStateAction<Date>> | ((arg: Date) => void)
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
          variant='outline'
          size='xs'
          className='justify-center text-left font-normal text-sm whitespace-nowrap px-2 text-muted-foreground'
        >
          <span className={cn(defaultDate({ forceYear }))}>{formattedDate}</span>
          <span className={cn(longDate({ forceYear }))}>{longFormattedDate}</span>
        </Button>

      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={(selectedDate) => {
            if (!selectedDate) return

            if (changeDate) {
              changeDate(undefined, { from: format(selectedDate, 'yyyy-MM-dd') }, 'self')
            }

            if (setDate) {
              setDate(selectedDate)
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>

  )
}
