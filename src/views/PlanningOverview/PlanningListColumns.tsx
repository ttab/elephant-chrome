
import { type ColumnDef } from '@tanstack/react-table'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Title } from '@/components/Table/Items/Title'
import { Assignees } from '@/components/Table/Items/Assignees'
import { Type } from '@/components/Table/Items/Type'
import { Actions } from '@/components/Table/Items/Actions'
import {
  SignalHighIcon,
  PenIcon,
  ShapesIcon,
  UsersIcon,
  CrosshairIcon,
  NavigationIcon,
  CircleCheckIcon
} from '@ttab/elephant-ui/icons'
import { Newsvalues, NewsvalueMap, getAssignmentTypes, getPlanningEventStatuses } from '@/defaults'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBAuthor, type IDBSection } from 'src/datastore/types'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { getNestedFacetedUniqueValues } from '@/components/Table/lib/getNestedFacetedUniqueValues'
import { getStatusFromMeta } from '@/lib/getStatusFromMeta'
import type { PreprocessedPlanningData } from './preprocessor'
import type { TFunction, Namespace } from 'i18next'
import type { TranslationKey } from '@/types/i18next.d'

export function planningListColumns<Ns extends Namespace>({ sections = [], authors = [], user }: {
  sections?: IDBSection[]
  authors?: IDBAuthor[]
  user?: string
}, t: TFunction<Ns>): Array<ColumnDef<PreprocessedPlanningData>> {
  const sectionOptions = sections.map((_) => ({
    value: _.id,
    label: _.title
  }))

  const authorOptions = authors.map((a) => ({
    value: a.id,
    label: a.name
  }))

  return [
    {
      id: 'documentStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: getPlanningEventStatuses(),
        name: t('core:labels.status'),
        columnIcon: CircleCheckIcon,
        className: 'flex-none',
        display: (value: string) => {
          const statusLabel = t?.(`core:status.${value}` as TranslationKey)
          return (
            <span>
              {statusLabel}
            </span>
          )
        }
      },
      accessorFn: (data) => {
        if (!data.meta) {
          return 'draft'
        }

        return getStatusFromMeta(data.meta, false).name
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        const updated = row.original.__updater && user !== row.original.__updater.sub
        return <DocumentStatus type='core/planning-item' status={status} updated={updated} />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id)),
      enableColumnFilter: true
    },
    {
      id: 'newsvalue',
      enableGrouping: true,
      enableSorting: true,
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: Newsvalues,
        name: t('core:labels.newsvalue'),
        columnIcon: SignalHighIcon,
        className: 'flex-none hidden @3xl/view:[display:revert]'
      },
      accessorFn: (data: PreprocessedPlanningData) =>
        data._preprocessed?.newsvalue,
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]

        if (newsvalue) {
          return <Newsvalue newsvalue={newsvalue} />
        }
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id)),
      enableColumnFilter: true
    },
    {
      id: 'title',
      meta: {
        name: t('core:labels.title'),
        columnIcon: PenIcon,
        className: 'flex-1 min-w-0'
      },
      accessorFn: (data) =>
        data._preprocessed?.title ?? data.document?.title,
      cell: ({ row }) => {
        const slugline = (row.original)._preprocessed?.slugline
        const title = row.getValue<string>('title')

        return <Title title={title} slugline={slugline} />
      },
      enableGrouping: false
    },
    {
      id: 'section',
      meta: {
        options: sectionOptions,
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        quickFilter: true,
        name: t('core:labels.section'),
        columnIcon: ShapesIcon,
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]',
        display: (value: string) => (
          <span>
            {sections
              .find((section) => section.id === value)?.title}
          </span>
        )
      },
      accessorFn: (data) =>
        data._preprocessed?.sectionUuid,
      cell: ({ row }) => {
        const sectionTitle = row.original._preprocessed?.sectionTitle
        return (
          <>
            {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
          </>
        )
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    {
      id: 'assignees',
      meta: {
        options: authorOptions,
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        name: t('core:labels.assignee'),
        columnIcon: UsersIcon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]',
        display: (value: string) => {
          const names = value.split(',').filter(Boolean)
          return <Assignees assignees={names} tooltip={false} />
        }
      },
      getGroupingValue: (data) => {
        const assignees = data._preprocessed?.assignees ?? []
        return assignees
          .map((uuid) => authors.find((a) => a.id === uuid)?.name ?? '??')
          .sort((a, b) => a.localeCompare(b))
          .join(',')
      },
      accessorFn: (data) => data._preprocessed?.assignees || [],
      cell: ({ row }) => {
        const assignees = (row.getValue<string[]>('assignees') || []).map((assigneeId) =>
          authors.find((author) => author.id === assigneeId)?.name || '')
          .sort((a, b) => a.localeCompare(b))

        return <Assignees assignees={assignees} />
      },
      sortingFn: (rowA, rowB, columnId) => {
        const toKey = (row: typeof rowA) =>
          (row.getValue<string[]>(columnId) || [])
            .map((uuid) => authors.find((a) => a.id === uuid)?.name ?? '??')
            .sort((a, b) => a.localeCompare(b))
            .join(',')
        return toKey(rowA).localeCompare(toKey(rowB))
      },
      filterFn: (row, id, value: string[]) => {
        const assignees = row.getValue<string[]>(id) || []
        return value.some((v) => assignees.includes(v))
      },
      enableGrouping: true
    },
    {
      id: 'type',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        options: getAssignmentTypes(),
        name: t('core:labels.assignmentType') || '',
        columnIcon: CrosshairIcon,
        className: 'flex-none w-[120px] hidden @6xl/view:[display:revert]',
        display: (value: string | string[]) => {
          const items = getAssignmentTypes()
            .filter((type) => value.includes(type.value))
            .map((item) => t(`shared:assignmentTypes.${item.value}` as TranslationKey))
          return (
            <div className='flex flex-row gap-2'>
              <span>
                {items.join('/')}
              </span>
            </div>
          )
        }
      },
      accessorFn: (data) => data._preprocessed?.types || [],
      cell: ({ row }) => {
        const data = getAssignmentTypes().filter(
          (assignmentType) => (row.getValue<string[]>('type') || []).includes(assignmentType.value)
        )

        if (data.length === 0) {
          return null
        }

        return <Type data={data} />
      },
      filterFn: (row, id, value: string[]) =>
        value.some((v: string) => row.getValue<string[] | undefined>(id)?.includes(v))
    },
    {
      id: 'action',
      meta: {
        name: t('core:labels.action'),
        columnIcon: NavigationIcon,
        className: 'flex-none'
      },
      cell: ({ row }) => {
        const deliverableUuids = row.original._preprocessed?.deliverableUuids || []
        const planningId = row.original.id

        return <Actions deliverableUuids={deliverableUuids} planningId={planningId} />
      },
      enableColumnFilter: false
    }
  ]
}
