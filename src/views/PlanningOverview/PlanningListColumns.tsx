
import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '@/hooks/index/useDocuments/schemas/planning'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Title } from '@/components/Table/Items/Title'
import { Assignees } from '@/components/Table/Items/Assignees'
import { Type } from '@/components/Table/Items/Type'
import { Actions } from '@/components/Table/Items/Actions'
import {
  SignalHigh,
  Pen,
  Shapes,
  Users,
  Crosshair,
  Navigation,
  CircleCheck
} from '@ttab/elephant-ui/icons'
import { Newsvalues, NewsvalueMap, AssignmentTypes, DocumentStatuses } from '@/defaults'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBAuthor, type IDBSection } from 'src/datastore/types'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { getNestedFacetedUniqueValues } from '@/components/Table/lib/getNestedFacetedUniqueValues'

export function planningListColumns({ sections = [], authors = [] }: {
  sections?: IDBSection[]
  authors?: IDBAuthor[]
}): Array<ColumnDef<Planning>> {
  return [
    {
      id: 'documentStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: DocumentStatuses,
        name: 'Status',
        columnIcon: CircleCheck,
        className: 'flex-none',
        display: (value: string) => (
          <span>
            {DocumentStatuses
              .find((status) => status.value === value)?.label}
          </span>
        )
      },
      accessorFn: (data) => data?.fields['document.meta.status']?.values[0],
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
        name: 'Nyhetsvärde',
        columnIcon: SignalHigh,
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
        name: 'Titel',
        columnIcon: Pen,
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
        name: 'Sektion',
        columnIcon: Shapes,
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
        options: authors.map((_) => ({ value: _.name, label: _.name })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        name: 'Uppdragstagare',
        columnIcon: Users,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data.fields['document.meta.core_assignment.rel.assignee.title']?.values,
      cell: ({ row }) => {
        const assignees = row.getValue<string[]>('assignees') || []
        return <Assignees assignees={assignees} />
      },
      filterFn: (row, id, value: string[]) =>
        Array.isArray(value) && typeof value[0] === 'string'
          ? (row.getValue<string[]>(id) || []).includes(value[0])
          : false,
      sortingFn: 'alphanumeric',
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
        columnIcon: Crosshair,
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
        columnIcon: Navigation,
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
