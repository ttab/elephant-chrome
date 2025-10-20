import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { OptionsFilter } from '@/components/Filter/common/OptionsFilter'
import {
  BookUserIcon,
  CalendarIcon,
  CrosshairIcon,
  ShapesIcon,
  SignalHighIcon,
  TagIcon,
  UsersIcon
} from '@ttab/elephant-ui/icons'
import { useCategories, useOrganisers, useSections, useQuery, useAuthors } from '@/hooks'
import { Newsvalues } from '@/defaults/newsvalues'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import type { FilterProps } from '@/components/Filter'
import { DatePicker } from '@/components/Datepicker'
import { useMemo } from 'react'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import { parseDate } from '@/shared/datetime'

export const Commands = (props: FilterProps & { type: SearchKeys }): JSX.Element => {
  if (props.page === undefined || props.pages === undefined || props.setPages === undefined || props.setSearch === undefined) {
    throw new Error('No props passed to Command component')
  }

  const { type } = props

  const [filters, setFilters] = useQuery(['section', 'organiser', 'category', 'from', 'author', 'aType', 'newsvalue'])
  const hasFilter = Object.values(filters).some((value) => value?.length)

  const { from } = filters
  const currentDate = useMemo(() => {
    return Array.isArray(from)
      ? parseDate(from[0]) || new Date()
      : typeof from === 'string'
        ? parseDate(from) || new Date()
        : new Date()
  }, [from])

  const handleClear = () => {
    setFilters({})
  }

  const sections = useSections()?.map((s) => ({
    value: s.id,
    label: s.title
  })) ?? []

  const organisers = useOrganisers()?.map((o) => ({
    value: o.id,
    label: o.title
  })) ?? []

  const categories = useCategories()?.map((c) => ({
    value: c.id,
    label: c.title
  })) ?? []

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
        Icon={ShapesIcon}
      />
      <OptionsFilter
        {...props}
        options={Newsvalues}
        label='Nyhetsvärde'
        filterPage='newsvalue'
        Icon={SignalHighIcon}
      />
      {type !== 'articles' && type !== 'events' && (
        <OptionsFilter
          {...props}
          options={AssignmentTypes}
          label='Typ'
          filterPage='aType'
          Icon={CrosshairIcon}
        />
      )}
      {type === 'events' && (
        <>
          <OptionsFilter
            {...props}
            options={organisers}
            label='Organisatör'
            filterPage='organiser'
            Icon={BookUserIcon}
          />
          <OptionsFilter
            {...props}
            options={categories}
            label='Kategori'
            filterPage='category'
            Icon={TagIcon}
          />
        </>
      )}
      {type !== 'events' && (
        <OptionsFilter
          {...props}
          options={authors}
          label='Uppdragstagare'
          filterPage='author'
          Icon={UsersIcon}
        />
      )}
      <div className='flex gap-1 w-full items-center px-2 my-1'>
        <CalendarIcon size={18} strokeWidth={1.75} />
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
