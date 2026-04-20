import { Title } from '@/components/Table/Items/Title'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import type { Factbox } from '@/shared/schemas/factbox'
import { dateToReadableDateTime } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import type { TranslationKey } from '@/types/i18next.d'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { BoxesIcon, CircleCheckIcon, NewspaperIcon } from '@ttab/elephant-ui/icons'
import type { TFunction, Namespace } from 'i18next'

interface FactboxData {
  title: string
  text: string
  modified: string
  id: string
  version: string
}

export function factboxColumns<Ns extends Namespace>({ locale, timeZone, t }: { locale: LocaleData, timeZone: string, t: TFunction<Ns> }): Array<ColumnDef<Factbox>> {
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
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: t('core:labels.status'),
        columnIcon: CircleCheckIcon,
        className: 'flex-none',
        display: (value: string) => (
          <span>{t(`core:status.${value}` as TranslationKey)}</span>
        )
      },
      cell: ({ row }) => {
        const currentStatus = row.original.fields['workflow_state']?.values[0]
        const origin = row.original.fields['_document_origin']?.values[0] ?? 'core/factbox'
        return (
          <div className='relative w-fit'>
            {
              origin === 'core/article'
                ? (
                    <div title={t('workflows:base.usable.title')}>
                      <CircleCheckIcon strokeWidth={1.75} className='text-white rounded-full dark:text-black bg-usable fill-usable' />
                    </div>
                  )
                : (
                    <DocumentStatus type='core/factbox' status={currentStatus} />
                  )
            }
          </div>
        )
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id))
    },
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
      },
      enableGlobalFilter: true
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
      },
      enableGlobalFilter: true
    },
    {
      id: 'documentOrigin',
      meta: {
        name: t('views:factboxes.columnLabels.origin'),
        columnIcon: BoxesIcon,
        className: 'flex-none',
        options: [
          { label: t('factboxes.origin.inArticle'), value: 'core/article' },
          { label: t('factboxes.origin.original'), value: 'core/factbox' }
        ],
        quickFilter: true
      },
      accessorFn: (data) => data.fields['_document_origin']?.values[0] ?? 'core/factbox',
      cell: ({ row }) => {
        const origin = row.getValue<string>('documentOrigin')
        const Icon = origin === 'core/article' ? NewspaperIcon : BoxesIcon
        return (
          <div className='flex items-center relative' title={origin === 'core/article' ? t('factboxes.origin.inArticle') : t('factboxes.origin.original')}>

            <Icon strokeWidth={1} size={16} />

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
