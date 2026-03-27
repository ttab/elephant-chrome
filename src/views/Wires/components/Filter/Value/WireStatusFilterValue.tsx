import { CircleCheckIcon } from '@ttab/elephant-ui/icons'
import { FilterBadge } from '../FilterBadge'

const wireStatusLabels: Record<string, string> = {
  read: 'Läst',
  saved: 'Sparad',
  used: 'Använd',
  flash: 'Flash'
}

export const WireStatusFilterValue = ({ values }: {
  values: string[]
}) => {
  const labels = values.map((v) => wireStatusLabels[v] ?? v)

  return (
    <>
      <CircleCheckIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
