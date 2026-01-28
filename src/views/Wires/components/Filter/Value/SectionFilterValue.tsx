import { useSections } from '@/hooks/useSections'
import { ShapesIcon } from '@ttab/elephant-ui/icons'
import { FilterBadge } from '../FilterBadge'

export const SectionFilterValue = ({ values }: {
  values: string[]
}) => {
  const sections = useSections()
  const labels = sections.filter((v) => values.includes(v.id)).map((v) => v.title)

  return (
    <>
      <ShapesIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
