import { DatePicker } from '@/components/Datepicker'
import type { FormProps } from '@/components/Form/Root'
import { useRegistry, useYValue } from '@/hooks'
import { newLocalDate, parseDate } from '@/lib/datetime'

export const PlanDate = ({ onChange }: FormProps): JSX.Element => {
  const { timeZone } = useRegistry()

  const [startString, setStartString] = useYValue<string>('meta.core/planning-item[0].data.start_date')
  const [, setEndString] = useYValue<string>('meta.core/planning-item[0].data.end_date')

  const setDateString = (date: string) => {
    onChange?.(true)

    setStartString(date)
    setEndString(date)
  }

  const newDate = newLocalDate(timeZone)
  const date = startString ? parseDate(startString) || newDate : newDate

  return (
    <div>
      <DatePicker date={date} setDate={setDateString} forceYear={true} />
    </div>
  )
}
