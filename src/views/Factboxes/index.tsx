import { useMemo, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader, View } from '@/components'
import { TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/components/Header'
import { Commands } from '@/components/Commands'
import { factboxColumns } from './FactboxColumns'
import type { Factbox } from '@/hooks/index/lib/factboxes'
import { FactboxList } from './FactboxList'
import { useRegistry } from '@/hooks/useRegistry'

const meta: ViewMetadata = {
  name: 'Factboxes',
  path: `${import.meta.env.BASE_URL}/factboxes`,
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

export const Factboxes = (): JSX.Element => {
  const [currentTab, setCurrentTab] = useState<string>('list')
  const { locale, timeZone } = useRegistry()

  const columns = useMemo(() =>
    factboxColumns({ locale, timeZone }), [locale, timeZone])

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<Factbox>
        columns={columns}
        type={meta.name}
      >
        <TableCommandMenu heading='Factboxes'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Title name='Factboxes' title='Faktarutor' />
          <ViewHeader.Content>
            <Header type='Factbox' />
          </ViewHeader.Content>
          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <FactboxList columns={columns} />
          </TabsContent>

          <TabsContent value='grid'>
          </TabsContent>
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Factboxes.meta = meta
