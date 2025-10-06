import { Title } from '@/components/Table/Items/Title'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'
import type { SectionConcept } from '@/shared/schemas/conceptSchemas/sectionConcept'

interface SectionConceptData {
  title: string
  id: string
}

export function sectionConceptColumns(): Array<ColumnDef<SectionConcept>> {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, row: Row<SectionConcept>) => {
    const SectionConceptData: SectionConceptData = {
      title: row.getValue<string>('title'),
      id: row.original.id
    }

    event.dataTransfer.setData('core/concept', JSON.stringify({
      title: SectionConceptData.title,
      id: SectionConceptData.id
    }))
  }

  return [
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => {
        console.log(data)
        return data.fields['document.title'].values[0]
      },
      cell: ({ row }) => {
        return (
          <div
            draggable='true'
            onDragStart={(event) => handleDragStart(event, row)}
          >
            <Title title={row.getValue<string>('title')} />
          </div>
        )
      }

    }
  ]
}
