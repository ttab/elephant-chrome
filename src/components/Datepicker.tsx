import { useState, type MouseEvent } from 'react'

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { useQuery, useRegistry } from '@/hooks'
import { cva } from 'class-variance-authority'
import { format } from 'date-fns'
import { type ViewProps } from '../types'

export const DatePicker = ({ date, changeDate, setDate, forceYear = false, disabled = false }: {
  date: Date
  changeDate?: (event: MouseEvent<Element> | KeyboardEvent | undefined, props: ViewProps, target?: 'self') => void
  setDate?: ((arg: string) => void)
  forceYear?: boolean
  disabled?: boolean
}): JSX.Element => {
  const { locale, timeZone } = useRegistry()
  const [open, setOpen] = useState<boolean>(false)

  const [query] = useQuery()

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
    <Popover modal={true} open={open} onOpenChange={setOpen}>
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
          disabled={disabled}
          mode='single'
          locale={locale.module}
          selected={date}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              if (changeDate) {
                changeDate(undefined, { ...query, from: format(selectedDate, 'yyyy-MM-dd') }, 'self')
              }

              if (setDate) {
                setDate(format(selectedDate, 'yyyy-MM-dd'))
              }
            }
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>

  )
}
