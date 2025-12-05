import { DatePicker } from '@/components/Datepicker'
import type { FormProps } from '@/components/Form/Root'
import { useRegistry } from '@/hooks'
import { useYValue } from '@/modules/yjs/hooks'
import { newLocalDate, parseDate } from '@/shared/datetime'
import type * as Y from 'yjs'
import type { JSX } from 'react'

type PlanDateProps = FormProps & (
  | { planningItem: Y.Map<unknown>, onValueChange: (newValue: string) => void, onChange?: never }
  | { planningItem: Y.Map<unknown>, onChange?: (arg: boolean) => void, onValueChange?: never }
)

export const PlanDate = ({ planningItem, onChange, onValueChange }: PlanDateProps): JSX.Element => {
  const { timeZone } = useRegistry()
  const [startString, setStartString] = useYValue<string>(planningItem, 'meta.core/planning-item[0].data.start_date')
  const [, setEndString] = useYValue<string>(planningItem, 'meta.core/planning-item[0].data.end_date')

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
