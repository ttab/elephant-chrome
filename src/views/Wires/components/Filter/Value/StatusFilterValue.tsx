import { CircleCheckIcon } from '@ttab/elephant-ui/icons'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { FilterBadge } from '../FilterBadge'

export const StatusFilterValue = ({ values }: {
  values: string[]
}) => {
  const labels = DocumentStatuses.filter((v) => values.includes(v.value)).map((v) => v.label)

  return (
    <>
      <CircleCheckIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
