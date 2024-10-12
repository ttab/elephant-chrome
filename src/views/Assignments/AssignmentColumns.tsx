/* eslint-disable react/prop-types */
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Briefcase, Crosshair, SignalHigh, Users } from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults/newsvalues'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'
import { getNestedFacetedUniqueValues } from '@/components/Filter/lib/getNestedFacetedUniqueValues'
import { type MetaValueType, type MetaTwo, Assignee, AssigneeMeta, Status } from './types'
import { type ColumnDef } from '@tanstack/react-table'
import { type DefaultValueOption } from '@/types/index'
import { type IDBAuthor } from 'src/datastore/types'
import { Assignees } from '@/components/Table/Items/Assignees'

export function assignmentColumns({ authors = [] }: {
  authors?: IDBAuthor[]
}): Array<ColumnDef<MetaTwo & { planningTitle: string, newsvalue: string }>> {
  return [
    {
      id: 'assignmentType',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        options: AssignmentTypes,
        name: 'Uppdragstyp',
        columnIcon: Crosshair,
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4'
      },
      accessorFn: (data) => {
        const assignmentTypes = data?.meta?.filter((metaType: MetaValueType) => metaType.type === 'core/assignment-type')
        return assignmentTypes?.map(type => {
          return AssignmentTypes.find(aType => {
            return aType.value === type.value && type.value
          })
        })
      },
      cell: ({ row }) => {
        const values: DefaultValueOption[] = row.getValue('assignmentType')
        return <Type data={values} />
      }
    },
    {
      id: 'titles',
      meta: {
        name: 'Titlar',
        columnIcon: Briefcase,
        className: 'box-content w-[450px]'
      },
      accessorFn: (data) => {
        const documentTitle = data.planningTitle
        const assignmentTitle = data.title
        return {
          documentTitle,
          assignmentTitle
        }
      },
      cell: ({ row }) => {
        const data: { documentTitle: string, assignmentTitle: string } = row.getValue('titles') || {}
        const { assignmentTitle, documentTitle } = data
        return (
          <div className='truncate pr-1 sm:pr-4 gap-1 items-center flex w-[450px]'>
            <div className='truncate space-x-2 items-center text-muted-foreground w-[200px] max-w-[200px] min-w-[200px]'>{documentTitle}</div>
            {'>'}
            <div className='flex flex-1 space-x-2 items-center'>{assignmentTitle}</div>
          </div>
        )
      }
    },
    {
      id: 'newsvalue',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: Newsvalues,
        name: 'Nyhetsvärde',
        columnIcon: SignalHigh,
        className: 'box-content w-4 sm:w-8 pr-1 sm:pr-4'
      },
      accessorFn: (data) => {
        return data.newsvalue
      },
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]

        if (newsvalue) {
          return <Newsvalue newsvalue={newsvalue} />
        }
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
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
      accessorFn: (data) => data.links,
      cell: ({ row }) => {
        const data = row.getValue<Array<AssigneeMeta | Status>>('assignees') || [] as AssigneeMeta[]
        console.log('🍄 ~ data ✅ ', data)
        const assignees = data.map((assignee: AssigneeMeta) => assignee?.title)
        // const _assignees = ['Victor Lindh']

        return <Assignees assignees={assignees} />
      },
      filterFn: (row, id, value) => (
        typeof value?.[0] === 'string'
          ? (row.getValue<string[]>(id) || []).includes(value[0])
          : false
      )
    }
  ]
}

// export function assignmentColumns({ authors = [], sections = [] }: {
//   authors?: IDBAuthor[]
//   sections?: IDBSection[]
// }): Array<ColumnDef<Planning>> {
//   return [
//     {
//       id: 'newsvalue',
//       meta: {
//         Filter: ({ column, setSearch }) => (
//           <FacetedFilter column={column} setSearch={setSearch} />
//         ),
//         options: Newsvalues,
//         name: 'Nyhetsvärde',
//         columnIcon: SignalHigh,
//         className: 'box-content w-4 sm:w-8 pr-1 sm:pr-4'
//       },
//       accessorFn: (data) => data._source['document.meta.core_newsvalue.value']?.[0],
//       cell: ({ row }) => {
//         const value: string = row.getValue('newsvalue') || ''
//         const newsvalue = NewsvalueMap[value]

//         if (newsvalue) {
//           return <Newsvalue newsvalue={newsvalue} />
//         }
//       },
//       filterFn: (row, id, value) => {
//         return value.includes(row.getValue(id))
//       }
//     },
//     {
//       id: 'title',
//       meta: {
//         name: 'Titel',
//         columnIcon: CircleCheck,
//         className: 'box-content truncate'
//       },
//       accessorFn: (data) => {
//         const docTitle = data?._source['document.title'][0]
//         const assignmentTitle = data?._source['document.meta.core_assignment.title'][0]
//         return `${docTitle}${docTitle ? ', ' + assignmentTitle : assignmentTitle}`
//       },
//       cell: ({ row }) => {
//         const title = row.getValue<string>('title')
//         const slugline = row.original._source['document.meta.tt_slugline.value']?.[0]
//         return <Title title={title} slugline={slugline} />
//       }
//     },
//     {
//       id: 'section',
//       meta: {
//         options: sections.map(_ => {
//           return {
//             value: _.id,
//             label: _.title
//           }
//         }),
//         Filter: ({ column, setSearch }) => (
//           <FacetedFilter column={column} setSearch={setSearch} />
//         ),
//         name: 'Sektion',
//         columnIcon: Shapes,
//         className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
//       },
//       accessorFn: (data) => {
//         return data._source['document.rel.section.uuid']?.[0]
//       },
//       cell: ({ row }) => {
//         const sectionTitle = row.original._source['document.rel.section.title']?.[0]
//         return <>
//           {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
//         </>
//       },
//       filterFn: (row, id, value) => {
//         return value.includes(row.getValue(id))
//       }
//     },
//     {
//       id: 'assignees',
//       meta: {
//         options: authors?.map((_) => ({ value: _.title, label: _.title })),
//         Filter: ({ column, setSearch }) => (
//           <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
//         ),
//         name: 'Uppdragstagare',
//         columnIcon: Users,
//         className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
//       },
//       accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
//       cell: ({ row }) => {
//         const assignees = row.getValue<string[]>('assignees') || []
//         return <Assignees assignees={assignees} />
//       },
//       filterFn: (row, id, value) => (
//         typeof value?.[0] === 'string'
//           ? (row.getValue<string[]>(id) || []).includes(value[0])
//           : false
//       )
//     },
//     {
//       id: 'type',
//       meta: {
//         Filter: ({ column, setSearch }) => (
//           <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
//         ),
//         options: AssignmentTypes,
//         name: 'Typ',
//         columnIcon: Crosshair,
//         className: 'box-content hidden w-[120px] @6xl/view:[display:revert]'
//       },
//       accessorFn: (data) => data._source['document.meta.core_assignment.meta.core_assignment_type.value'],
//       cell: ({ row }) => {
//         const data = AssignmentTypes.filter(
//           (assignmentType) => (row.getValue<string[]>('type') || []).includes(assignmentType.value)
//         )
//         if (data.length === 0) {
//           return null
//         }

//         return <Type data={data} />
//       },
//       filterFn: (row, id, value) => (
//         value.some((v: string) => row.getValue<string[] | undefined>(id)?.includes(v))
//       )
//     }
//   ]
// }
