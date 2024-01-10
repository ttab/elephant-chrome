import { useEffect } from 'react'
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


// FIXME: Needs refactoring into a more global settings file
import { priorities } from '../PlanningOverview/PlanningTable/data/settings'
import { convertToISOStringInTimeZone } from '@/lib/datetime'

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
  const isDuration = !!duration && duration === parseInt(duration).toString(10)
  const isEnd = !isDuration && !!end
  const { locale, timeZone } = useRegistry()

  let label = '∞'
  if (isDuration) {
    const secs = parseInt(duration)
    const hours = Math.ceil(secs / 3600)
    label = `${hours}h`
  } else if (isEnd) {
    label = convertToISOStringInTimeZone(new Date(end), locale, timeZone)
  }

  /*
    "data": {
      "end": "2024-01-11T08:00:00.000Z",
      "score": "4"
    },

    or

    "data": {
          "duration": "86400",
          "score": "2"
    },
  */

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 p-0 px-2 mb-1 data-[state=open]:bg-muted"
        >
          <span className="flex items-end">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px]">
        <Tabs defaultValue={label} onValueChange={(value) => {
          if (['24h', '∞'].includes(value)) {
            onChange(value === '24h' ? '86400' : '', undefined)
          }
        }}>

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="∞">∞</TabsTrigger>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="datetime">Tid</TabsTrigger>
          </TabsList>


          <TabsContent value="∞" className="p-3">
            <h2 className="font-medium leading-none pb-1">Livslängd</h2>
            <p className="text-sm text-muted-foreground">Ingen sluttid specificerad</p>
          </TabsContent>

          <TabsContent value="24h" className="p-3">
            <h2 className="font-medium leading-none pb-1">Livslängd</h2>
            <p>24 timmar från publicering</p>
          </TabsContent>

          <TabsContent value="datetime" className="p-3">
            <h2 className="font-medium leading-none pb-1">Livslängd till...</h2>
            <Calendar
              mode='single'
              selected={isEnd ? new Date(end) : new Date()}
              onSelect={(selectedDate) => {
                onChange(undefined, selectedDate?.toISOString())
              }}
              initialFocus
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
