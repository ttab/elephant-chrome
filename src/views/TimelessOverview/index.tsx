import { useMemo, useState, type JSX } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader, View } from '@/components'
import { Header } from '@/components/Header'
import { TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Commands } from '@/components/Commands'
import { createTimelessColumns } from './lib/createTimelessColumns'
import type { TimelessArticle } from '@/shared/schemas/timelessArticle'
import { TimelessList } from './TimelessList'
import { useQuery } from '@/hooks/useQuery'
import { useInitFilters } from '@/hooks/useInitFilters'
import { useRegistry } from '@/hooks/useRegistry'
import { useTimelessCategories } from '@/hooks/useTimelessCategories'
import { useTranslation } from 'react-i18next'

const meta: ViewMetadata = {
  name: 'Timeless',
  path: `${import.meta.env.BASE_URL}/timeless`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Timeless = (): JSX.Element => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const { locale, timeZone } = useRegistry()
  const categories = useTimelessCategories()
  const { t } = useTranslation('views')
  const [query] = useQuery()

  const columns = useMemo(() =>
    createTimelessColumns({ locale, timeZone, categories, t }),
  [locale, timeZone, categories, t])

  const savedFilters = useInitFilters<TimelessArticle>({
    path: 'filters.Timeless.current',
    columns
  })

  // Default: hide used timeless articles. Once the user opens the status
  // filter in the toolbar they can include them explicitly.
  const columnFilters = useMemo(() => {
    if (savedFilters.length > 0) {
      return savedFilters
    }
    return [{ id: 'status', value: ['draft', 'done'] }]
  }, [savedFilters])

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<TimelessArticle>
        columns={columns}
        type={meta.name}
        initialState={{
          columnFilters,
          globalFilter: query.query
        }}
      >
        <TableCommandMenu heading='Timeless'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title
              name='Timeless'
              title={t('timeless.title')}
            />
            <Header type='Timeless' docType='core/article#timeless' />
          </ViewHeader.Content>

          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <TimelessList columns={columns} />
          </TabsContent>
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Timeless.meta = meta
