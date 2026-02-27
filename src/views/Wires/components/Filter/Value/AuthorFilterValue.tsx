import { useAuthors } from '@/hooks/useAuthors'
import { UsersIcon } from '@ttab/elephant-ui/icons'
import { FilterBadge } from '../FilterBadge'

export const AuthorFilterValue = ({ values }: {
  values: string[]
}) => {
  const authors = useAuthors()
  const labels = authors.filter((v) => values.includes(v.id)).map((v) => v.name)

  return (
    <>
      <UsersIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
