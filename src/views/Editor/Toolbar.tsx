import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@ttab/elephant-ui'
import { SignalMedium } from '@ttab/elephant-ui/icons'
import { useYMap } from '@/hooks/useYjsMap'
import type * as Y from 'yjs'
import { useRegistry } from '@/hooks'
import { ComboBox } from '@/components/ui'

// FIXME: Needs refactoring into a more global settings file
import { priorities } from '../PlanningOverview/PlanningTable/data/settings'
import { dateToReadableDateTime, dateToReadableTime, is12HourcycleFromLocale } from '@/lib/datetime'

interface ToolbarProps {
  isSynced: boolean
  document?: Y.Doc
}

export const Toolbar = ({ isSynced, document }: ToolbarProps): JSX.Element => {
  const [newsvalueScore, setNewsvalueScore, initNewsvalueScore] = useYMap('core/newsvalue/score')
  const [newsvalueDuration, setNewsvalueDuration, initNewsvalueDuration] = useYMap('core/newsvalue/duration')
  const [newsvalueEnd, setNewsvalueEnd, initNewsvalueEnd] = useYMap('core/newsvalue/end')

  useEffect(() => {
    if (!isSynced || !document) {
      return
    }

    const metaYMap = document.getMap('meta')
    initNewsvalueDuration(metaYMap)
    initNewsvalueScore(metaYMap)
    initNewsvalueEnd(metaYMap)
  }, [
    isSynced,
    document,
    initNewsvalueDuration,
    initNewsvalueScore,
    initNewsvalueEnd
  ])

  return (
    <>
      <NewsScoreDropDown
        value={newsvalueScore as string}
        onChange={(value) => {
          setNewsvalueScore(value as number)
        }}
        options={priorities.map(p => {
          return {
            label: p.label,
            value: p.value,
            icon: <p.icon color={p.color} />
          }
        })}
      />

      <DurationDropDown
        duration={typeof newsvalueDuration === 'string' ? newsvalueDuration : undefined}
        end={typeof newsvalueEnd === 'string' ? newsvalueEnd : undefined}
        onChange={(setDuration, setEnd) => {
          setNewsvalueDuration(setDuration)
          setNewsvalueEnd(setEnd)
        }}
      />
    </>
  )
}


interface NewsScoreDropDownProps {
  value: string
  options: Array<{
    label: string
    value: string | number
    icon?: JSX.Element
  }>
  onChange: (value: unknown) => void
}

function NewsScoreDropDown({ value, options, onChange }: NewsScoreDropDownProps): JSX.Element {
  const option = options.find(option => option.value === value)
  const Icon = option?.icon || <SignalMedium />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 p-0 px-2 data-[state=open]:bg-muted items-start"
        >
          <span className={`flex items-end ${!option?.label ? 'opacity-40' : ''}`}>
            {Icon}
            {option?.label || '∞'}
          </span>

          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((priority) => {
          return (
            <DropdownMenuItem key={priority.value}>
              <span
                className="flex items-end text-sm"
                onClick={() => { onChange(priority.value) }}
              >
                {!!priority.icon && (priority.icon)}
                {priority.label}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


interface DurationDropDownProps {
  duration?: string
  end?: string
  onChange: (duration: string | undefined, end: string | undefined) => void
}

function DurationDropDown({ duration, end, onChange }: DurationDropDownProps): JSX.Element {
  const { locale, timeZone } = useRegistry()
  const isDuration = !!duration && duration === parseInt(duration).toString(10)
  const isEnd = !isDuration && !!end
  const [time, setTime] = useState(isEnd ? new Date(end) : new Date())

  let value = '∞'
  if (isDuration) {
    const secs = parseInt(duration)
    const hours = Math.ceil(secs / 3600)
    value = `${hours}h`
  } else if (isEnd) {
    value = 'datetime'
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 p-0 px-2 mb-1 data-[state=open]:bg-muted"
        >
          <span className="flex items-end">{isEnd ? dateToReadableDateTime(new Date(end), locale, timeZone) : value}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px]">
        <Tabs defaultValue={value} onValueChange={(value) => {
          if (['24h', '∞'].includes(value)) {
            onChange(value === '24h' ? '86400' : '', undefined)
          }
        }}>

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="∞">∞</TabsTrigger>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="datetime">
              {isEnd
                ? dateToReadableDateTime(new Date(end), locale, timeZone)
                : 'Tidpunkt'
              }
            </TabsTrigger>
          </TabsList>


          <TabsContent value="∞" className="p-3">
            <h2 className="font-medium leading-none pb-1">Lifetime</h2>
            <p className="text-sm text-muted-foreground">Not specified</p>
          </TabsContent>

          <TabsContent value="24h" className="p-3">
            <h2 className="font-medium leading-none pb-1">Lifetime</h2>
            <p>24 hours from published time</p>
          </TabsContent>

          <TabsContent value="datetime" className="p-3">
            <h2 className="font-medium leading-none pb-1">Lifetime to specified time</h2>
            <Calendar
              className="px-0"
              mode='single'
              selected={time}
              onSelect={(selectedDate) => {
                onChange(undefined, selectedDate?.toISOString())
              }}
              initialFocus
            />

            <TimePicker
              value={time}
              timeZone={timeZone}
              locale={locale}
              onSelect={(value) => {
                onChange(undefined, value.toISOString())
              }}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover >
  )
}


interface TimePickerProps {
  value: Date
  locale: string
  timeZone: string
  onSelect: (value: Date) => void
}

function TimePicker({ value, onSelect, locale, timeZone }: TimePickerProps): JSX.Element {
  const times = useMemo(() => {
    const times = []
    const is12Hour = is12HourcycleFromLocale(locale)

    const date = new Date()
    let minutes = 0
    let hours = 0

    while (hours < 24) {
      date.setHours(hours)
      date.setMinutes(minutes)

      times.push({
        value: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
        label: date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: is12Hour })
      })

      if (minutes === 45) {
        minutes = 0
        hours++
      } else {
        minutes += 15
      }
    }

    return times
  }, [locale])

  const time = dateToReadableTime(value, locale, timeZone)
  return <ComboBox
    options={times}
    selectedOption={times.find(({ value }: { value: string }) => value === time) || times[0]}
    placeholder={time || ''}
    onSelect={(option) => {
      const newTime = times.find(t => t.value === option.value)
      if (newTime) {
        const hours = parseInt(time?.substring(0, 2) || '0')
        const minutes = parseInt(time?.substring(3, 5) || '0')
        value.setHours(!isNaN(hours) ? hours : 0)
        value.setMinutes(!isNaN(minutes) ? minutes : 0)
        value.setSeconds(0)
        value.setMilliseconds(0)

        onSelect(value)
      }
    }}
  />
}
