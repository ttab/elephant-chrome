import { CommandList } from '@ttab/elephant-ui'
import { OptionsFilter } from '@/components/Filter/common/OptionsFilter'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import type { Facets } from '@/hooks/index/lib/assignments/filterAssignments'
import { useQuery } from '@/hooks/useQuery'
import type { FilterProps } from '@/components/Filter'
import { useSections } from '@/hooks/useSections'
import { CircleCheck, Shapes } from '@ttab/elephant-ui/icons'
import { DocumentStatuses } from '@/defaults/documentStatuses'

export const Commands = (props: {
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

  const optionsSections = useSections().map((_) => {
    return {
      value: _.id,
      label: _.title
    }
  })

  return (
    <CommandList>
      <OptionsFilter
        {...props}
        options={DocumentStatuses}
        label='Status'
        filterPage='status'
        Icon={CircleCheck}
        facets={props.facets?.section}
      />
      <OptionsFilter
        {...props}
        options={optionsSections}
        label='Sektion'
        filterPage='section'
        Icon={Shapes}
        facets={props.facets?.section}
      />
      <ClearFilter hasFilter={hasFilter} onClear={handleClear} />
    </CommandList>
  )
}
