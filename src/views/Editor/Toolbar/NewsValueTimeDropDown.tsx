import { useMemo } from 'react'
import {
  Button, Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@ttab/elephant-ui'
import { useRegistry } from '@/hooks'
import { ComboBox } from '@/components/ui'
import { dateToReadableDateTime, is12HourcycleFromLocale } from '@/lib/datetime'

interface NewsValueDropDownProps {
  duration?: string
  end?: string
  onChange: (duration: string | undefined, end: string | undefined) => void
}
export function NewsValueTimeDropDown({ duration, end, onChange }: NewsValueDropDownProps): JSX.Element {
  const { locale, timeZone } = useRegistry()
  const isDuration = !!duration && duration === parseInt(duration).toString(10)
  const isEnd = !isDuration && !!end
  const endTime = end ? new Date(end) : new Date()

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
              Time
            </TabsTrigger>
          </TabsList>


          <TabsContent value="∞" className="p-3">
            <h2 className="font-medium leading-none pb-2">Lifetime</h2>
            <p className="text-muted-foreground text-sm">Not specified</p>
          </TabsContent>

          <TabsContent value="24h" className="p-3">
            <h2 className="font-medium leading-none pb-2">Lifetime</h2>
            <p className="text-muted-foreground text-sm">24 hours from published time</p>
          </TabsContent>

          <TabsContent value="datetime" className="p-3">
            <div className="flex flex-col divide-y">
              <div className="pb-3">
                <h2 className="font-medium leading-none pb-2">Specified time</h2>
                <p className="text-muted-foreground text-sm">Choose a specific time and date</p>
              </div>
              <div className="py-3">
                <TimePicker
                  value={endTime.toLocaleString(
                    undefined,
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                      timeZone
                    })}
                  locale={locale}
                  onSelect={(selectedTime) => {
                    const hours = parseInt(selectedTime.substring(0, 2) || '0')
                    const minutes = parseInt(selectedTime.substring(3, 5) || '0')
                    endTime.setHours(!isNaN(hours) ? hours : 0)
                    endTime.setMinutes(!isNaN(minutes) ? minutes : 0)
                    endTime.setSeconds(0)
                    endTime.setMilliseconds(0)

                    onChange(undefined, endTime.toISOString())
                  }}
                />
              </div>

              <div className="py-3">
                <Calendar
                  className="px-0"
                  mode='single'
                  selected={endTime}
                  onSelect={(selectedDate) => {
                    if (!selectedDate) {
                      return
                    }

                    endTime.setFullYear(selectedDate.getFullYear())
                    endTime.setMonth(selectedDate.getMonth())
                    endTime.setDate(selectedDate.getDate())

                    onChange(undefined, endTime.toISOString())
                  }}
                  initialFocus
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}


interface TimePickerProps {
  value: string
  locale: string
  onSelect: (value: string) => void
}
function TimePicker({ value, onSelect, locale }: TimePickerProps): JSX.Element {
  const timesList = useMemo(() => {
    const is12Hour = is12HourcycleFromLocale(locale)
    const date = new Date()
    let minutes = 0
    let hours = 0

    const timesList = []
    while (hours < 24) {
      date.setHours(hours)
      date.setMinutes(minutes)

      timesList.push({
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

    return timesList
  }, [locale])

  const selectedOption = timesList.find(time => time.value === value)
  return <ComboBox
    options={timesList}
    selectedOption={selectedOption}
    placeholder={selectedOption?.label || 'Select a time...'}
    onSelect={(option) => {
      onSelect(option.value)
    }} />
}
