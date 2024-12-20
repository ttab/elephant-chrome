import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { Cable, Minus } from '@ttab/elephant-ui/icons'
import { useMemo } from 'react'
import { Sources } from './components'
import { wiresListColumns } from './WiresListColumns'
import { Commands } from '@/components/Commands'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { TableProvider } from '@/contexts/TableProvider'
import { WireList } from './WiresList'
import { type Wire as WireType } from '@/lib/index/schemas/wire'
import { type WireSearchParams, Wires as WiresIndex } from '@/lib/index'
import { SWRProvider } from '@/contexts/SWRProvider'
import { Pagination } from '@/components/Table/Pagination'
import { Controller } from './components/Controller'
import { useView, useHistory, useSections } from '@/hooks'
import type { HistoryInterface } from '@/navigation/hooks/useHistory'
import { ViewDialogClose } from '@/components/View/ViewHeader/ViewDialogClose'
import { ViewFocus } from '@/components/View/ViewHeader/ViewFocus'

const meta: ViewMetadata = {
  name: 'Wires',
  path: `${import.meta.env.BASE_URL}/wires`,
  widths: {
    sm: 12,
    md: 12,
    lg: 4,
    xl: 4,
    '2xl': 4,
    hd: 3,
    fhd: 3,
    qhd: 3,
    uhd: 2
  }
}

export const Wires = (): JSX.Element => {
  const sections = useSections()
  const { viewId, isFocused } = useView()
  const history = useHistory()
  const isLast = history.state?.contentState[history.state?.contentState.length - 1]?.viewId === viewId
  const isFirst = history.state?.contentState[0]?.viewId === viewId

  const columns = useMemo(() => wiresListColumns({ sections }), [sections])

  return (
    <View.Root>
      <TableProvider<WireType> columns={columns}>
        <SWRProvider<WireType, WireSearchParams> index={WiresIndex}>
          <TableCommandMenu heading='Wires'>
            <Commands />
          </TableCommandMenu>

          <ViewHeader.Root>
            {isFirst && (
              <ViewHeader.Title
                title='Telegram'
                short='Telegram'
                icon={Cable}
                iconColor='#FF6347'
              />
            )}

            <ViewHeader.Content>
              <Sources />
              <div className='flex gap-2'>
                {!isFocused && isLast && (
                  <Controller />
                )}
                {!isFocused && (history.state?.contentState?.length ?? 0) > 1
                && <ViewDialogClose onClick={() => handleClose(viewId, history)} Icon={Minus} />}
              </div>
            </ViewHeader.Content>

            <div className='flex gap-2'>
              <ViewFocus viewId={viewId} />
            </div>
          </ViewHeader.Root>

          <View.Content>
            <WireList />
            <Pagination />
          </View.Content>

        </SWRProvider>
      </TableProvider>
    </View.Root>
  )
}

function handleClose(
  viewId?: string,
  history?: HistoryInterface): void {
  if (viewId && history) {
    const newContentState = (history.state?.contentState.filter((obj) => obj.viewId !== viewId) || [])
    // TODO: Get new url
    history.replaceState('/elephant/wires', { viewId: viewId || '', contentState: newContentState })
  }
}
Wires.meta = meta
