import { useOrganisers } from '@/hooks/useOrganisers'
import { ContactIcon } from '@ttab/elephant-ui/icons'
import { FilterBadge } from '../FilterBadge'

export const OrganiserFilterValue = ({ values }: {
  values: string[]
}) => {
  const organisers = useOrganisers()
  const labels = organisers.filter((v) => values.includes(v.id)).map((v) => v.title)

  return (
    <>
      <ContactIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
