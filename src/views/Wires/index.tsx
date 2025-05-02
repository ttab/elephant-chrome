import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { Minus, Save } from '@ttab/elephant-ui/icons'
import { useMemo } from 'react'
import { wiresListColumns } from './WiresListColumns'
import { Commands } from '@/components/Commands'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { TableProvider } from '@/contexts/TableProvider'
import { WireList } from './WiresList'
import { Pagination } from '@/components/Table/Pagination'
import { Controller } from './components/Controller'
import { useView, useHistory, useSections } from '@/hooks'
import type { HistoryInterface, HistoryState } from '@/navigation/hooks/useHistory'
import { ViewDialogClose } from '@/components/View/ViewHeader/ViewDialogClose'
import { ViewFocus } from '@/components/View/ViewHeader/ViewFocus'
import { Button } from '@ttab/elephant-ui'
import { useUserTracker } from '@/hooks/useUserTracker'
import type { Wire } from '@/hooks/index/useDocuments/schemas/wire'

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
  const [, setWiresHistory] = useUserTracker<HistoryState>('Wires')

  const columns = useMemo(() => wiresListColumns({ sections }), [sections])

  return (
    <View.Root>
      <TableProvider<Wire>
        type={meta.name}
        columns={columns}
        initialState={{
          grouping: ['modified']
        }}
      >
        <TableCommandMenu heading='Wires'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          {isFirst && (
            <>
              <ViewHeader.Title title='Telegram' name='Wires' />

              <Button
                variant='ghost'
                onClick={() => {
                  if (history.state) {
                    // When persisting a WireHistory set first view as active
                    setWiresHistory({
                      ...history.state,
                      viewId: history.state.contentState[0].viewId
                    })
                  }
                }}
              >
                <Save strokeWidth={1.75} size={18} />
              </Button>
            </>
          )}

          <ViewHeader.Content>
            <div className='flex gap-2'>
              {!isFocused && isLast && (
                <Controller />
              )}
              {!isFocused && (history.state?.contentState?.length ?? 0) > 1
              && (
                <ViewDialogClose
                  onClick={() => handleClose(viewId, history)}
                  Icon={Minus}
                />
              )}
            </div>
          </ViewHeader.Content>

          <div className='flex gap-2'>
            <ViewFocus viewId={viewId} />
          </div>
        </ViewHeader.Root>

        <View.Content>
          <WireList columns={columns} />
          <Pagination />
        </View.Content>

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
