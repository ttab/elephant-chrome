import { CommandList } from '@ttab/elephant-ui'
import { OptionsFilter } from '@/components/Filter/common/OptionsFilter'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import type { Facets } from '@/hooks/index/lib/assignments/filterAssignments'
import type { QueryParams } from '@/hooks/useQuery'
import { useQuery } from '@/hooks/useQuery'
import type { FilterProps } from '@/components/Filter'
import { useSections } from '@/hooks/useSections'
import { CircleCheckIcon, ShapesIcon } from '@ttab/elephant-ui/icons'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { useUserTracker } from '@/hooks/useUserTracker'
import { type JSX } from 'react'

export const Commands = (props: {
  facets?: Facets
} & FilterProps): JSX.Element => {
  if (props.page === undefined || props.pages === undefined || props.setPages === undefined || props.setSearch === undefined) {
    throw new Error('No props passed to Command component')
  }

  const [filters, setFilters] = useQuery(['status', 'section'])
  const [, setCurrentFilters] = useUserTracker<QueryParams | undefined>(`filters.Approvals.current`)
  const hasFilter = Object.values(filters).some((value) => value?.length)

  const handleClear = () => {
    setFilters({})
    setCurrentFilters({})
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
        Icon={CircleCheckIcon}
        facets={props.facets?.section}
      />
      <OptionsFilter
        {...props}
        options={optionsSections}
        label='Sektion'
        filterPage='section'
        Icon={ShapesIcon}
        facets={props.facets?.section}
      />
      <ClearFilter hasFilter={hasFilter} onClear={handleClear} />
    </CommandList>
  )
}
