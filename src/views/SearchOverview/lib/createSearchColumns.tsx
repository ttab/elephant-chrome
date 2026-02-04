import { parseDate, dateToReadableShort } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import { eventTableColumns } from '@/views/EventsOverview/EventsListColumns'
import { planningListColumns } from '@/views/PlanningOverview/PlanningListColumns'
import type { IDBAuthor, IDBOrganiser, IDBSection } from 'src/datastore/types'
import search from '@/hooks/index/useDocuments/queries/views/search'
import type { SearchKeys } from '@/hooks/index/useDocuments/queries/views/search'
import { articleColumns } from './articleColumns'
import { CalendarIcon } from '@ttab/elephant-ui/icons'
import type { TFunction } from 'i18next'

interface SearchColumnsParams {
  searchType: SearchKeys
  sections: IDBSection[]
  authors: IDBAuthor[]
  organisers?: IDBOrganiser[]
  locale: LocaleData
  timeZone: string
}
export const createSearchColumns = (params: SearchColumnsParams, t: TFunction) => {
  return [
    {
      id: 'date',
      enableGrouping: true,
      meta: {
        name: t('views:search.columnLabels.date'),
        columnIcon: CalendarIcon,
        className: 'flex-none w-[100px]',
        display: (value: string) => {
          const formattedDate = parseDate(value)
          if (formattedDate instanceof Date) {
            const day = dateToReadableShort(formattedDate, params.locale.code.full, params.timeZone)
            return (
              <span>{day}</span>
            )
          }

          return <span>???</span>
        }
      },
      accessorFn: (data: { fields?: Record<string, { values?: string[] }> }) => {
        const key = search[params.searchType].dateGroupKey
        const startTime = data?.fields?.[key]?.values?.[0]
        if (!startTime) {
          return ''
        }
        return startTime.split('T')[0]
      }
    },
    ...getColumns(params, t)
  ]
}

function getColumns({ searchType, ...params }: SearchColumnsParams, t: TFunction) {
  switch (searchType) {
    case 'plannings':
      return planningListColumns(params)
    case 'events':
      return eventTableColumns(params)
    case 'articles':
      return articleColumns(params, t)
    default:
      throw new Error(`Unknown search type`)
  }
}
