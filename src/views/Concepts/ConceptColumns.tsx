import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { Title } from '@/components/Table/Items/Title'
import type { ColumnDef } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'
import type { IDBConcept } from 'src/datastore/types'


export function ConceptColumns(): Array<ColumnDef<IDBConcept>> {
  return [
    {
      id: 'documentStatus',
      meta: {
        name: 'Status',
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => {
        return data?.usableVersion && data.usableVersion > 0 ? 'usable' : 'cancelled'
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        return <DocumentStatus type='core/section' status={status} />
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
          <div>
            <Title title={row.getValue<string>('title')} className={row.original.usableVersion && row.original.usableVersion < 0 ? 'text-zinc-400' : ''} />
          </div>
        )
      }

    }
  ]
}
