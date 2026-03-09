import { Title } from '@/components/Table/Items/Title'
import type { Factbox } from '@/shared/schemas/factbox'
import { dateToReadableDateTime } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { BoxesIcon } from '@ttab/elephant-ui/icons'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'

interface FactboxData {
  title: string
  text: string
  modified: string
  id: string
  version: string
}

export function factboxColumns({ locale, timeZone }: { locale: LocaleData, timeZone: string }): Array<ColumnDef<Factbox>> {
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
      id: 'documentStatus',
      meta: {
        name: 'Status',
        columnIcon: BoxesIcon,
        className: 'flex-none',
        options: [
          { value: 'usable', label: 'Användbara' },
          { value: 'draft', label: 'Utkast' },
          { value: 'unpublished', label: 'Kastade' }
        ],
        quickFilter: true
      },
      accessorFn: (data) => {
        return data.fields['heads.usable.version']?.values[0] ? data.fields['heads.usable.version'].values[0] === '-1' ? 'unpublished' : 'usable' : 'draft'
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')

        return (
          <DocumentStatus status={status} type='core/factbox' />
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
      },
      enableGlobalFilter: true
    },
    {
      id: 'description',
      meta: {
        name: 'Beskrivning',
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
      },
      enableGlobalFilter: true
    },
    {
      id: 'edited',
      meta: {
        name: 'Senast ändrad',
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
              Ändrad
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
