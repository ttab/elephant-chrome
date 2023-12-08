import { ChevronLeft, ChevronRight } from '@ttab/elephant-ui/icons'
import { type PlanningHeaderProps } from '.'
import { DatePicker } from './Datepicker'

export const DateChanger = ({ date, setDate }: PlanningHeaderProps): JSX.Element => (
  <>
    <ChevronLeft
      className='w-4 h-4 mt-2 ml-4'
      onClick={() => setDate(new Date(date.setDate(date.getDate() - 1)))}
    />
    <DatePicker date={date} setDate={setDate}/>
    <ChevronRight
      className='w-4 h-4 mt-2'
      onClick={() => setDate(new Date(date.setDate(date.getDate() + 1)))}
    />
  </>
)

