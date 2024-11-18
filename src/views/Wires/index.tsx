import { ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { ScrollArea } from '@ttab/elephant-ui'
import { Cable } from '@ttab/elephant-ui/icons'
import { useMemo } from 'react'
import { Sources } from './components'
import { wiresListColumns } from './WiresListColumns'
import { Commands } from '@/components/Commands'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { TableProvider } from '@/contexts/TableProvider'
import { useSections } from '@/hooks/useSections'
import { WireList } from './WiresList'
import { type Wire as WireType } from '@/lib/index/schemas/wire'
import { type WireSearchParams, Wires as WiresIndex } from '@/lib/index'
import { SWRProvider } from '@/contexts/SWRProvider'
import { Pagination } from '@/components/Table/Pagination'

const meta: ViewMetadata = {
  name: 'Wires',
  path: `${import.meta.env.BASE_URL}/wires`,
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

export const Wires = (): JSX.Element => {
  const sections = useSections()

  const columns = useMemo(() => wiresListColumns({ sections }), [sections])

  return (
    <TableProvider<WireType> columns={columns}>
      <SWRProvider<WireType, WireSearchParams> index={WiresIndex}>
        <TableCommandMenu heading='Wires'>
          <Commands />
        </TableCommandMenu>
        <div className='flex flex-col h-screen'>
          <ViewHeader.Root>
            <ViewHeader.Title
              title='Telegram'
              short='Telegram'
              icon={Cable}
              iconColor='#FF6347'
            />

            <ViewHeader.Content>
              <Sources />
            </ViewHeader.Content>

            <ViewHeader.Action />
          </ViewHeader.Root>

          <ScrollArea>
            <WireList />
            <Pagination />
          </ScrollArea>
        </div>
      </SWRProvider>
    </TableProvider>
  )
}

Wires.meta = meta
