import { type MouseEvent } from 'react'

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
import type { QueryParams } from '@/hooks/useQuery'

export const DatePicker = ({ date, changeDate, setDate, forceYear = false, keepQuery }: {
  date: Date
  changeDate?: (event: MouseEvent<Element> | KeyboardEvent | undefined, props: ViewProps, target?: 'self') => void
  setDate?: ((arg: string) => void)
  forceYear?: boolean
  keepQuery?: QueryParams
}): JSX.Element => {
  const { locale, timeZone } = useRegistry()

  const formattedDate = new Intl.DateTimeFormat(locale.code.full, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone
  }).format(date)

  const longFormattedDate = new Intl.DateTimeFormat(locale.code.full, {
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
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='xs'
          className='justify-center text-left font-normal text-sm whitespace-nowrap px-2'
          onKeyDown={(event) => {
            if (event.key !== 'Escape') {
              event?.stopPropagation()
            }
          }}
        >
          <span className={cn(defaultDate({ forceYear }))}>{formattedDate}</span>
          <span className={cn(longDate({ forceYear }))}>{longFormattedDate}</span>
        </Button>

      </PopoverTrigger>
      <PopoverContent
        className='w-auto p-0'
        onEscapeKeyDown={(event) => event?.stopPropagation()}
        allowPropagationForKeys={['Escape', 'ArrowDown', 'ArrowUp']}
      >
        <Calendar
          mode='single'
          locale={locale.module}
          selected={date}
          onSelect={(selectedDate) => {
            if (!selectedDate) return

            if (changeDate) {
              changeDate(undefined, { ...(keepQuery && { ...keepQuery }), from: format(selectedDate, 'yyyy-MM-dd') }, 'self')
            }

            if (setDate) {
              setDate(format(selectedDate, 'yyyy-MM-dd'))
            }
          }}
        />
      </PopoverContent>
    </Popover>

  )
}
