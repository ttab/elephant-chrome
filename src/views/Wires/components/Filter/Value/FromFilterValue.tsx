import { CalendarIcon } from 'lucide-react'
import { FilterBadge } from '../FilterBadge'

export const FromFilterValue = ({ values }: {
  values: string[]
}) => {
  return (
    <>
      <CalendarIcon size={18} strokeWidth={1.75} className='mr-2' />
      <span className='text-xs'>sedan</span>
      <FilterBadge labels={values} />
    </>
  )
}
