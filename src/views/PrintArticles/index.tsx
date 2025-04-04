import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import { printArticlesListColumns } from './PrintArticlesListColumns'
import { TableProvider } from '@/contexts/TableProvider'
import { PrintArticleList } from './PrintArticlesList'
import { useSections } from '@/hooks'
import type { PrintArticle } from '@/hooks/index/lib/printArticles'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@ttab/elephant-ui'

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

  const [openCreateFlow, setOpenCreateFlow] = useState(false)

  return (
    <View.Root>
      <ViewHeader.Root className="flex flex-row gap-2 items-center justify-between">
        <ViewHeader.Title title='Print' name='PrintArticles' />
        <div className="flex flex-row gap-2 items-center justify-end">
          <Button variant="outline">Skapa artikel</Button>
          <Button variant="outline" onClick={() => setOpenCreateFlow(true)}>Skapa flöde</Button>
        </div>
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
      
      <Dialog open={openCreateFlow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa flöde</DialogTitle>
            <DialogDescription>Lista över flöden</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateFlow(false)}>Avbryt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View.Root>
  )
}

PrintArticles.meta = meta
