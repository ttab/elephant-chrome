import { DatePicker } from '@/components/Datepicker'
import type { FormProps } from '@/components/Form/Root'
import { useRegistry, useYValue } from '@/hooks'
import { newLocalDate, parseDate } from '@/lib/datetime'

type PlanDateProps = FormProps & (
  | { onValueChange: (newValue: string) => void, onChange?: never }
  | { onChange?: (arg: boolean) => void, onValueChange?: never }
)

export const PlanDate = ({ onChange, onValueChange }: PlanDateProps): JSX.Element => {
  const { timeZone } = useRegistry()

  const [startString, setStartString] = useYValue<string>('meta.core/planning-item[0].data.start_date')
  const [, setEndString] = useYValue<string>('meta.core/planning-item[0].data.end_date')

  const setDateString = (date: string) => {
    if (onValueChange) {
      onValueChange(date)
    } else {
      onChange?.(true)
      setStartString(date)
      setEndString(date)
    }
  }

  const newDate = newLocalDate(timeZone)
  const date = startString ? parseDate(startString) || newDate : newDate

  return (
    <div>
      <DatePicker date={date} setDate={setDateString} forceYear={true} />
    </div>
  )
}
