
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
import { Newsvalues, NewsvalueMap, AssignmentTypes, PlanningEventStatuses } from '@/defaults'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBAuthor, type IDBSection } from 'src/datastore/types'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { getNestedFacetedUniqueValues } from '@/components/Table/lib/getNestedFacetedUniqueValues'
import { getStatusFromMeta } from '@/lib/getStatusFromMeta'
import type { PreprocessedPlanningData } from './preprocessor'

export function planningListColumns({ sections = [], authors = [], user }: {
  sections?: IDBSection[]
  authors?: IDBAuthor[]
  user?: string
}): Array<ColumnDef<PreprocessedPlanningData>> {
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
        options: PlanningEventStatuses,
        name: 'Status',
        columnIcon: CircleCheckIcon,
        className: 'flex-none',
        display: (value: string) => (
          <span>
            {PlanningEventStatuses.find((status) => status.value === value)?.label}
          </span>
        )
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
        name: 'Nyhetsvärde',
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
        name: 'Titel',
        columnIcon: PenIcon,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) =>
        data.document?.title,
      cell: ({ row }) => {
        const slugline = (row.original)._preprocessed?.slugline
        const title = row.getValue('title')

        return <Title title={title as string} slugline={slugline} />
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
        name: 'Sektion',
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
        name: 'Uppdragstagare',
        columnIcon: UsersIcon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data._preprocessed?.assignees || [],
      cell: ({ row }) => {
        const assigneeIds = row.getValue<string[]>('assignees') || []

        const assignees = assigneeIds.map((assigneeId) => {
          return authors.find((author) => author.id === assigneeId)?.name || ''
        })

        return <Assignees assignees={assignees} />
      },
      sortingFn: 'alphanumeric',
      filterFn: (row, id, value: string[]) => {
        const assignees = row.getValue<string[]>(id) || []
        return value.some((v) => assignees.includes(v))
      },
      enableGrouping: false
    },
    {
      id: 'type',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        options: AssignmentTypes,
        name: 'Typ',
        columnIcon: CrosshairIcon,
        className: 'flex-none w-[120px] hidden @6xl/view:[display:revert]',
        display: (value: string | string[]) => {
          const items = AssignmentTypes
            .filter((type) => value.includes(type.value))
            .map((item) => item.label)
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
        const typeValues = row.getValue<string[]>('type') || []
        const data = AssignmentTypes.filter(
          (assignmentType) => typeValues.includes(assignmentType.value)
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
        name: 'Action',
        columnIcon: NavigationIcon,
        className: 'flex-none'
      },
      cell: ({ row }) => {
        const deliverableUuids = row.original._preprocessed?.deliverableUuids || []
        const planningId = row.original.document?.uuid || ''

        return <Actions deliverableUuids={deliverableUuids} planningId={planningId} />
      },
      enableColumnFilter: false
    }
  ]
}
