import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { Title } from '@/components/Table/Items/Title'
import { ConceptStatuses } from '@/defaults/documentStatuses'
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
        className: 'flex-none',
        options: ConceptStatuses,
        display: (value: string) => {
          return <span>{value}</span>
        },
        quickFilter: true
      },
      accessorFn: (data) => {
        return data?.usableVersion && data.usableVersion > 0 ? 'usable' : 'inactive'
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus') === 'usable' ? 'usable' : 'unpublished'
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
        const status = row.getValue<string>('documentStatus') === 'usable' ? 'usable' : 'inactive'
        return (
          <div>
            <Title title={row.getValue<string>('title')} className={status === 'inactive' ? 'text-zinc-500' : ''} />
          </div>
        )
      },
      enableGrouping: false

    }
  ]
}
