/* eslint-disable react/prop-types */
import { type ColumnDef } from '@tanstack/react-table'

// import {
//   CircleCheck,
//   Crosshair,
//   Shapes,
//   SignalHigh,
//   Users
// } from '@ttab/elephant-ui/icons'
// import { type IDBSection, type IDBAuthor } from 'src/datastore/types'
// import { getNestedFacetedUniqueValues } from '@/components/Filter/lib/getNestedFacetedUniqueValues'
// import { FacetedFilter } from '@/components/Commands/FacetedFilter'
// import { Assignees } from '@/components/Table/Items/Assignees'
// import { AssignmentTypes } from '@/defaults/assignmentTypes'
// import { Type } from '@/components/Table/Items/Type'
// import { Time } from '@/components/Table/Items/Time'
// import { Newsvalues } from '@/defaults/newsvalues'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { type MetaValueType, type MetaTwo } from './types'
import { Briefcase, SignalHigh } from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults/newsvalues'
import { Title } from '@/components/Table/Items/Title'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { typeFormat } from './lib/assignmentType'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'

export function assignmentColumns(/* { authors = [], sections = [] }: {
  authors?: IDBAuthor[]
  sections?: IDBSection[]
} */): Array<ColumnDef<MetaTwo & { planningTitle: string, newsvalue: string }>> {
  return [
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
      id: 'titles',
      meta: {
        name: 'Uppdragstitlar',
        columnIcon: Briefcase,
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4'
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
          <div>
            <div className='flex gap-4'>
              <Title title={documentTitle} slugline='' />
              <div>{'>'}</div>
              <Title title={assignmentTitle} slugline='' />
            </div>
          </div>
        )
      }
    },
    {
      id: 'assignmentType',
      meta: {
        name: 'Uppdragstyp',
        columnIcon: Briefcase,
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4'
      },
      accessorFn: (data) => {
        const assignmentTypes = data?.meta?.filter((metaType: MetaValueType) => metaType.type === 'core/assignment-type')
        return assignmentTypes?.map(type => {
          return AssignmentTypes.find(aType => {
            console.log('atype', aType)
            console.log('type value', type.value)
            return aType.value === type.value && type.value
          })
        })
      },
      cell: ({ row }) => {
        const values = row.getValue('assignmentType')
        console.log('🍄 ~ values ✅ ', values)
        return <Type data={values} />
        // return values.map((v: 'text' | 'picture') => typeFormat[v])
      }
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
