import { DatePicker } from '@/components/Datepicker'
import { useYValue } from '@/hooks'

export const PlanDate = (): JSX.Element => {
  const [dateString, setDateString] = useYValue<string>('meta.core/planning-item[0].data.start_date')

  const date = dateString ? parseDate(dateString) || new Date() : new Date()

  return (
    <div>
      <DatePicker date={date} setDate={setDateString} forceYear={true} />
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
