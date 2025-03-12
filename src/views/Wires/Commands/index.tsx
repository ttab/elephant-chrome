import { CommandList } from '@ttab/elephant-ui'
import { Section, Source, Newsvalue } from './Items'
import { Text } from './Items/Text'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { useQuery } from '@/hooks/useQuery'
import type { FilterProps } from '@/components/Filter'

export const Commands = (props: FilterProps): JSX.Element => {
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
      <Text {...props} />
      <Section {...props} />
      <Source {...props} />
      <Newsvalue {...props} />
      <ClearFilter
        hasFilter={hasFilter}
        onClear={handleClear}
      />
    </CommandList>
  )
}
