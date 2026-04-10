import { CrosshairIcon } from '@ttab/elephant-ui/icons'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { FilterBadge } from '../FilterBadge'

export const ATypeFilterValue = ({ values }: {
  values: string[]
}) => {
  const labels = AssignmentTypes.filter((v) => values.includes(v.value)).map((v) => v.label)

  return (
    <>
      <CrosshairIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
