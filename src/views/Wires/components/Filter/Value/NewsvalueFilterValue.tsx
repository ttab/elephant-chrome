import { SignalHighIcon } from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults/newsvalues'
import { FilterBadge } from '../FilterBadge'

export const NewsvalueFilterValue = ({ values }: {
  values: string[]
}) => {
  const labels = Newsvalues.filter((v) => values.includes(v.value)).map((v) => v.label)

  return (
    <>
      <SignalHighIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
