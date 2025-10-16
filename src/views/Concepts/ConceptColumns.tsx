import { Title } from '@/components/Table/Items/Title'
import type { ColumnDef } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'
import type { Concept } from '@/shared/schemas/conceptSchemas/baseConcept'


export function ConceptColumns(): Array<ColumnDef<Concept>> {
  return [
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => {
        return data.fields['_usable_title'].values[0]
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
