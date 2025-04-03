import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useMemo } from 'react'
import { printArticlesListColumns } from './PrintArticlesListColumns'
import { TableProvider } from '@/contexts/TableProvider'
import { PrintArticleList } from './PrintArticlesList'
import { useView, useHistory, useSections } from '@/hooks'
import type { HistoryInterface, HistoryState } from '@/navigation/hooks/useHistory'
import { ViewDialogClose } from '@/components/View/ViewHeader/ViewDialogClose'
import { ViewFocus } from '@/components/View/ViewHeader/ViewFocus'
import { Button } from '@ttab/elephant-ui'
import { useUserTracker } from '@/hooks/useUserTracker'
import type { PrintArticle } from '@/hooks/index/lib/printArticles'

const meta: ViewMetadata = {
  name: 'PrintArticles',
  path: `${import.meta.env.BASE_URL}/print`,
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

export const PrintArticles = (): JSX.Element => {
  const sections = useSections()
  const { viewId, isFocused } = useView()
  const history = useHistory()
  // const isLast = history.state?.contentState[history.state?.contentState.length - 1]?.viewId === viewId
  // const isFirst = history.state?.contentState[0]?.viewId === viewId
  // const [, setWiresHistory] = useUserTracker<HistoryState>('Wires')

  const columns = useMemo(() => printArticlesListColumns({ sections }), [sections])

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Print' name='PrintArticles' />
      </ViewHeader.Root>
      <TableProvider<PrintArticle>
        type={meta.name}
        columns={columns}
        initialState={{}}
      >
        <View.Content>
          <PrintArticleList columns={columns} />
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
    history.replaceState('/elephant/print', { viewId: viewId || '', contentState: newContentState })
  }
}
PrintArticles.meta = meta
