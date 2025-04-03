import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useMemo } from 'react'
import { printArticlesListColumns } from './PrintArticlesListColumns'
import { TableProvider } from '@/contexts/TableProvider'
import { PrintArticleList } from './PrintArticlesList'
import { useSections } from '@/hooks'
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

PrintArticles.meta = meta
