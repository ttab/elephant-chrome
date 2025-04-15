import { DatePicker } from '@/components/Datepicker'
import { useYValue } from '@/hooks'
import { parseDate } from '@/lib/datetime'

export const PlanDate = (): JSX.Element => {
  const [dateString, setDateString] = useYValue<string>('meta.core/planning-item[0].data.start_date')

  const date = dateString ? parseDate(dateString) || new Date() : new Date()

  return (
    <div>
      <DatePicker date={date} setDate={setDateString} forceYear={true} />
    </div>
  )
}
