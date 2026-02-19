import { useMemo, useState, type JSX } from 'react'
import { View, ViewHeader } from '@/components'
import { TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { Header } from '@/components/Header'
import type { PreprocessedLatestData } from './preprocessor'
import { LatestList } from './LatestList'
import { latestColumns } from './LatestColumns'
import { useRegistry } from '@/hooks/useRegistry'
import { type ViewMetadata } from '@/types'
import { useSections } from '@/hooks/useSections'

const meta: ViewMetadata = {
  name: 'Latest',
  path: `${import.meta.env.BASE_URL || ''}/latest`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 4,
    fhd: 3,
    qhd: 3,
    uhd: 3
  }
}

export const Latest = (): JSX.Element => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const { locale, timeZone } = useRegistry()
  const sections = useSections()

  const columns = useMemo(() =>
    latestColumns({ locale, timeZone, sections }), [locale, timeZone, sections])

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<PreprocessedLatestData>
        type={meta.name}
        columns={columns}
        initialState={{
          sorting: [{ id: 'publishTime', desc: true }]
        }}
      >
        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name={meta.name} title='Senast utgivet' />
            <Header type={meta.name} />
          </ViewHeader.Content>

          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <LatestList columns={columns} />
          </TabsContent>
        </View.Content>

      </TableProvider>
    </View.Root>
  )
}

Latest.meta = meta
