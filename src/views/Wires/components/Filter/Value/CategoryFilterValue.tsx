import { useCategories } from '@/hooks/useCategories'
import { TagIcon } from 'lucide-react'
import { FilterBadge } from '../FilterBadge'

export const CategoryFilterValue = ({ values }: {
  values: string[]
}) => {
  const categories = useCategories()
  const labels = categories.filter((v) => values.includes(v.id)).map((v) => v.title)

  return (
    <>
      <TagIcon size={18} strokeWidth={1.75} className='mr-2' />
      <FilterBadge labels={labels} />
    </>
  )
}
