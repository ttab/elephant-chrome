import { CommandList } from '@ttab/elephant-ui'
import { SectionFilter, StatusFilter } from './Items/'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import type { Facets } from '@/hooks/index/lib/assignments/filterAssignments'
import { useQuery } from '@/hooks/useQuery'
import type { FilterProps } from '@/components/Filter'

export const GridCommands = (props: {
  facets?: Facets
} & FilterProps): JSX.Element => {
  if (props.page === undefined || props.pages === undefined || props.setPages === undefined || props.setSearch === undefined) {
    throw new Error('No props passed to Command component')
  }

  const [filters, setFilters] = useQuery(['status', 'section'])
  const hasFilter = Object.values(filters).some((value) => value?.length)

  const handleClear = () => {
    setFilters({})
  }
  return (
    <CommandList>
      <StatusFilter {...props} facets={props.facets?.status} />
      <SectionFilter {...props} facets={props.facets?.section} />
      <ClearFilter hasFilter={hasFilter} onClear={handleClear} />
    </CommandList>
  )
}
