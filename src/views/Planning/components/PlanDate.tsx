import { DatePicker } from '@/components/Datepicker'
import { useYObserver, useRegistry } from '@/hooks'

export const PlanDate = (): JSX.Element => {
  const { get, set } = useYObserver('meta', 'core/planning-item[0].data')
  const { timeZone } = useRegistry()


  const date = parseDate(get('start_date') as string) || new Date()
  const setDate = () => (date: Date) => {
    set(format(date, timeZone),
      'start_date')
  }

  return (
    <div>
      <DatePicker date={date} setDate={setDate} forceYear={true} />
    </div>
  )
}

function parseDate(value: string): Date | undefined {
  if (!value) {
    return
  }

  const parts: string[] = value.split('-')

  return new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  )
}

function format(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone
  })

  const [
    { value: month },
    ,
    { value: day },
    ,
    { value: year }
  ] = formatter.formatToParts(date)

  return `${year}-${month}-${day}`
}
