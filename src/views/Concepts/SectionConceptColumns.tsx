import { Title } from '@/components/Table/Items/Title'
import type { ColumnDef } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'
import type { SectionConcept } from '@/shared/schemas/conceptSchemas/sectionConcept'


export function sectionConceptColumns(): Array<ColumnDef<SectionConcept>> {
  return [
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => {
        return data.fields['document.title'].values[0]
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
