import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { OptionsFilter } from '@/components/Filter/common/OptionsFilter'
import { BookUser, Calendar, Crosshair, Shapes, SignalHigh, Tag, Users } from '@ttab/elephant-ui/icons'
import { useCategories, useOrganisers, useSections, useQuery, useAuthors } from '@/hooks'
import { Newsvalues } from '@/defaults/newsvalues'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import type { FilterProps } from '@/components/Filter'
import type { SearchType } from './SearchDropdown'
import { DatePicker } from '@/components/Datepicker'
import { useMemo } from 'react'

export const Commands = (props: FilterProps & { type: SearchType }): JSX.Element => {
  if (props.page === undefined || props.pages === undefined || props.setPages === undefined || props.setSearch === undefined) {
    throw new Error('No props passed to Command component')
  }

  const { type } = props

  const [filters, setFilters] = useQuery(['section', 'organiser', 'category', 'from', 'author', 'aType', 'newsvalue'])
  const hasFilter = Object.values(filters).some((value) => value?.length)

  const { from } = filters
  const currentDate = useMemo(() => {
    return typeof from === 'string'
      ? new Date(from)
      : new Date()
  }, [from])

  const handleClear = () => {
    setFilters({})
  }

  const sections = useSections().map((s) => ({
    value: s.id,
    label: s.title
  }))

  const organisers = useOrganisers().map((o) => ({
    value: o.id,
    label: o.title
  }))

  const categories = useCategories().map((c) => ({
    value: c.id,
    label: c.title
  }))

  const authors = useAuthors().map((a) => ({
    value: a.id,
    label: a.name
  }))

  return (
    <CommandList>
      <OptionsFilter
        {...props}
        options={sections}
        label='Sektion'
        filterPage='section'
        Icon={Shapes}
      />
      <OptionsFilter
        {...props}
        options={Newsvalues}
        label='Nyhetsvärde'
        filterPage='newsvalue'
        Icon={SignalHigh}
      />
      {type !== 'articles' && (
        <OptionsFilter
          {...props}
          options={AssignmentTypes}
          label='Typ'
          filterPage='aType'
          Icon={Crosshair}
        />
      )}
      {type === 'events' && (
        <>
          <OptionsFilter
            {...props}
            options={organisers}
            label='Organisatör'
            filterPage='organiser'
            Icon={BookUser}
          />
          <OptionsFilter
            {...props}
            options={categories}
            label='Kategori'
            filterPage='category'
            Icon={Tag}
          />
        </>
      )}
      {type !== 'events' && (
        <OptionsFilter
          {...props}
          options={authors}
          label='Uppdragstagare'
          filterPage='author'
          Icon={Users}
        />
      )}
      <div className='flex gap-1 w-full items-center px-2 my-1'>
        <Calendar size={18} strokeWidth={1.75} />
        <div className='text-xs'>Från</div>
        <DatePicker
          date={currentDate}
          setDate={(d: string) => {
            setFilters({ ...filters, from: d })
          }}
        />
      </div>
      <ClearFilter
        hasFilter={hasFilter}
        onClear={handleClear}
      />
    </CommandList>
  )
}
