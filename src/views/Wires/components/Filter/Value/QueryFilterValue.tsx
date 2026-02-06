import { BinocularsIcon } from '@ttab/elephant-ui/icons'
import { FilterBadge } from '../FilterBadge'

export const QueryFilterValue = ({ values }: {
  values: string[]
}) => {
  return (
    <>
      <BinocularsIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={values} />
    </>
  )
}
