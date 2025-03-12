import { CommandList } from '@ttab/elephant-ui'
import { TextFilter } from '@/components/Filter/common/TextFilter'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { useQuery } from '@/hooks/useQuery'
import type { FilterProps } from '@/components/Filter'
import { OptionsFilter } from '@/components/Filter/common/OptionsFilter'
import { useSections } from '@/hooks/useSections'
import { Binoculars, Shapes, SignalHigh, SquareCode } from '@ttab/elephant-ui/icons'
import { useWireSources } from '@/hooks/useWireSources'
import { Newsvalues } from '@/defaults/newsvalues'

export const Commands = (props: FilterProps): JSX.Element => {
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

  const optionsSources = useWireSources().map(({ uri, title }) => ({
    value: uri,
    label: title
  }))

  return (
    <CommandList>
      <TextFilter
        {...props}
        label='Fritext'
        filterPage='query'
        Icon={Binoculars}
      />
      <OptionsFilter
        {...props}
        options={optionsSections}
        label='Sektion'
        filterPage='section'
        Icon={Shapes}
      />
      <OptionsFilter
        {...props}
        options={optionsSources}
        label='Källor'
        filterPage='source'
        Icon={SquareCode}
      />
      <OptionsFilter
        {...props}
        options={Newsvalues}
        label='Nyhetsvärde'
        filterPage='newsvalue'
        Icon={SignalHigh}
      />
      <ClearFilter
        hasFilter={hasFilter}
        onClear={handleClear}
      />
    </CommandList>
  )
}
