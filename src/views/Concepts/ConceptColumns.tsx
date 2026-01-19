import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { Title } from '@/components/Table/Items/Title'
import { ConceptStatuses } from '@/defaults/documentStatuses'
import type { Concept } from '@/shared/schemas/conceptSchemas/baseConcept'
import type { ColumnDef } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'


export function ConceptColumns(): Array<ColumnDef<Concept>> {
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
        return data?.fields['heads.usable.version'] && Number(data?.fields['heads.usable.version'].values[0]) > 0 ? 'usable' : 'inactive'
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
        return data?.fields['document.title'].values[0]
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
