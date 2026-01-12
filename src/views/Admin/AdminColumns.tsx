import { Title } from '@/components/Table/Items/Title'
import type { ColumnDef } from '@tanstack/react-table'
import { BoxesIcon, TagIcon } from '@ttab/elephant-ui/icons'
import type { IDBAdmin } from 'src/datastore/types'


export function AdminColumns(): Array<ColumnDef<IDBAdmin>> {
  return [
    {
      id: 'type',
      meta: {
        name: 'Type',
        columnIcon: TagIcon,
        className: 'flex-none'
      },
      cell: () => {
        return (
          <div>
            <TagIcon
              size={20}
              strokeWidth={1.75}
            />
          </div>
        )
      }

    },
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => {
        return data.title
      },
      cell: ({ row }) => {
        return (
          <div className='w-fit'>
            <Title title={row.getValue<string>('title')} />
          </div>
        )
      }

    },
    {
      id: 'description',
      meta: {
        name: 'Description',
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => {
        return data.description
      },
      cell: ({ row }) => {
        return (
          <div>
            {row.getValue<string>('description')}
          </div>
        )
      }

    },
    {
      id: 'documentType',
      meta: {
        name: 'DocumentType',
        columnIcon: BoxesIcon
      },
      accessorFn: (data) => {
        return data.documentType
      }
    }
  ]
}
