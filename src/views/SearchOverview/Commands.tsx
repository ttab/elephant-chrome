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
import { useMemo, type JSX } from 'react'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import { parseDate } from '@/shared/datetime'
import { useTranslation } from 'react-i18next'

export const Commands = (props: FilterProps & { type: SearchKeys }): JSX.Element => {
  if (props.page === undefined || props.pages === undefined || props.setPages === undefined || props.setSearch === undefined) {
    throw new Error('No props passed to Command component')
  }
  const { t } = useTranslation('core')
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
        label={t('labels.section')}
        filterPage='section'
        Icon={ShapesIcon}
      />
      <OptionsFilter
        {...props}
        options={Newsvalues}
        label={t('labels.newsvalue')}
        filterPage='newsvalue'
        Icon={SignalHighIcon}
      />
      {type !== 'articles' && type !== 'events' && (
        <OptionsFilter
          {...props}
          options={AssignmentTypes}
          label={t('labels.assignmentType')}
          filterPage='aType'
          Icon={CrosshairIcon}
        />
      )}
      {type === 'events' && (
        <>
          <OptionsFilter
            {...props}
            options={organisers}
            label={t('labels.organiser')}
            filterPage='organiser'
            Icon={BookUserIcon}
          />
          <OptionsFilter
            {...props}
            options={categories}
            label={t('labels.category')}
            filterPage='category'
            Icon={TagIcon}
          />
        </>
      )}
      {type !== 'events' && (
        <OptionsFilter
          {...props}
          options={authors}
          label={t('labels.assignee')}
          filterPage='author'
          Icon={UsersIcon}
        />
      )}
      <div className='flex gap-1 w-full items-center px-2 my-1'>
        <CalendarIcon size={18} strokeWidth={1.75} />
        <div className='text-xs'>{t('common:misc.from')}</div>
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
