
import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '@/shared/schemas/planning'
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
import type { TFunction } from 'i18next'

export function planningListColumns({ sections = [], authors = [], t }: {
  sections?: IDBSection[]
  authors?: IDBAuthor[]
  t?: TFunction<string>
}): Array<ColumnDef<Planning>> {
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
        const currentStatus = data?.fields['document.meta.status']?.values[0]
        const isUnpublished = data?.fields['heads.usable.version']?.values[0] === '-1'
        if (currentStatus === 'usable' && isUnpublished) {
          const lastModified = data?.fields['modified']?.values[0]
          const lastUsableCreated = data?.fields['heads.usable.created']?.values[0]

          if (lastModified > lastUsableCreated) {
            return 'draft'
          }
          return 'unpublished'
        }
        return currentStatus
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        return <DocumentStatus type='core/planning-item' status={status} />
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
        name: t?.('core.labels.newsvalue') || '',
        columnIcon: SignalHighIcon,
        className: 'flex-none hidden @3xl/view:[display:revert]'
      },
      accessorFn: (data) => data.fields['document.meta.core_newsvalue.value']?.values[0],
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
        name: t?.('core.labels.title') || '',
        columnIcon: PenIcon,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => data.fields['document.title']?.values[0],
      cell: ({ row }) => {
        const slugline = row.original.fields['document.meta.tt_slugline.value']?.values[0]
        const title = row.getValue('title')

        return <Title title={title as string} slugline={slugline} />
      },
      enableGrouping: false
    },
    {
      id: 'section',
      meta: {
        options: sections.map((_) => {
          return {
            value: _.id,
            label: _.title
          }
        }),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        quickFilter: true,
        name: t?.('core.labels.section') || '',
        columnIcon: ShapesIcon,
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]',
        display: (value: string) => (
          <span>
            {sections
              .find((section) => section.id === value)?.title}
          </span>
        )
      },
      accessorFn: (data) => {
        return data.fields['document.rel.section.uuid']?.values[0]
      },
      cell: ({ row }) => {
        const sectionTitle = row.original.fields['document.rel.section.title']?.values[0]
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
        options: authors.map((a) => ({ value: a.id, label: a.name })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        name: t?.('core.labels.assignee') || '',
        columnIcon: UsersIcon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data.fields['document.meta.core_assignment.rel.assignee.uuid']?.values,
      cell: ({ row }) => {
        const assignees = (row.getValue<string[]>('assignees') || []).map((assigneeId) => {
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
        name: t?.('core.labels.assignmentType') || '',
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
      accessorFn: (data) => data.fields['document.meta.core_assignment.meta.core_assignment_type.value']?.values,
      cell: ({ row }) => {
        const data = AssignmentTypes.filter(
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
        name: 'Action',
        columnIcon: NavigationIcon,
        className: 'flex-none'
      },
      cell: ({ row }) => {
        const deliverableUuids = row.original.fields['document.meta.core_assignment.rel.deliverable.uuid']?.values || []
        const planningId = row.original.id

        return <Actions deliverableUuids={deliverableUuids} planningId={planningId} />
      },
      enableColumnFilter: false
    }
  ]
}
