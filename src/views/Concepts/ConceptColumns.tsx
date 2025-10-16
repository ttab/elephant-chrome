import { Title } from '@/components/Table/Items/Title'
import type { ColumnDef } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'
import type { IDBSection } from 'src/datastore/types'


export function ConceptColumns(): Array<ColumnDef<IDBSection>> {
  return [
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
          <div
            draggable='false'
          >
            <Title title={row.getValue<string>('title')} />
          </div>
        )
      }

    }
  ]
}
