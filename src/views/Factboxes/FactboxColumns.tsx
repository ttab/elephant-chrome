import { Title } from '@/components/Table/Items/Title'
import type { Factbox } from '@/shared/schemas/factbox'
import { dateToReadableDateTime } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'
import type { TFunction } from 'i18next'

interface FactboxData {
  title: string
  text: string
  modified: string
  id: string
  version: string
}

export function factboxColumns({ locale, timeZone, t }: { locale: LocaleData, timeZone: string, t: TFunction }): Array<ColumnDef<Factbox>> {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, row: Row<Factbox>) => {
    const factboxData: FactboxData = {
      title: row.getValue<string>('title'),
      text: row.original.fields['document.content.core_text.data.text'].values.join('\n'),
      modified: row.getValue<string>('edited'),
      id: row.original.id,
      version: row.original.fields.current_version.values[0]
    }

    event.dataTransfer.setData('core/factbox', JSON.stringify({
      title: factboxData.title,
      text: factboxData.text,
      modified: factboxData.modified,
      id: factboxData.id,
      original_updated: factboxData.modified,
      original_version: factboxData.version
    }))
  }

  return [
    {
      id: 'title',
      meta: {
        name: t('core:labels.title'),
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => data.fields['document.title'].values[0],
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
    },
    {
      id: 'description',
      meta: {
        name: t('factboxes.columnLabels.description'),
        columnIcon: BoxesIcon,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => data.fields?.['document.content.core_text.data.text']?.values[0],
      cell: ({ row }) => {
        return (
          <div
            draggable='true'
            onDragStart={(event) => handleDragStart(event, row)}
            className='max-w-4xl font-thin text-sm text-muted-foreground truncate space-x-2 justify-start items-center'
          >
            {row.getValue<string>('description')}
          </div>
        )
      }
    },
    {
      id: 'edited',
      meta: {
        name: t('factboxes.columnLabels.lastChanged'),
        columnIcon: BoxesIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => data.fields.modified.values[0],
      cell: ({ row }) => {
        const edited = row.getValue<string>('edited')
        const readableDateTime = edited ? dateToReadableDateTime(new Date(edited), locale.code.full, timeZone, true) : '-'
        return (
          <div className='truncate space-x-2 justify-start items-center'>
            <span className='font-thin text-xs text-muted-foreground'>
              {t('core:status.changed')}
            </span>
            <span className='font-thin text-sm'>
              {readableDateTime}
            </span>
          </div>
        )
      }
    }
  ]
}
