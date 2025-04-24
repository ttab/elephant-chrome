import { View } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import { printArticlesListColumns } from './PrintArticlesListColumns'
import { TableProvider } from '@/contexts/TableProvider'
import { PrintArticleList } from './PrintArticlesList'
import type { PrintArticle } from '@/hooks/baboon/lib/printArticles'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@ttab/elephant-ui'
import { PrintFlows } from './PrintFlows'
import { PrintArticlesHeader } from './PrintArticlesHeader'

/**
 * Metadata for the PrintArticles view.
 *
 * This object defines the name, path, and responsive widths for the PrintArticles view.
 * It is used to configure the layout and routing of the view within the application.
 *
 * @type {ViewMetadata}
 */
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

/**
 * PrintArticles component.
 *
 * This component renders the Print Articles view, which includes a header, a table of print articles,
 * and dialogs for creating new articles and flows. It uses the TableProvider context to manage the
 * state and columns of the table.
 *
 * @returns {JSX.Element} The rendered PrintArticles component.
 */

export const PrintArticles = (): JSX.Element => {
  const columns = useMemo(
    () => printArticlesListColumns({ locale: 'sv' }),
    [printArticlesListColumns]
  )
  const [openCreateFlow, setOpenCreateFlow] = useState(false)
  const [openCreateArticle, setOpenCreateArticle] = useState(false)

  return (
    <View.Root>
      <PrintArticlesHeader setOpenCreateArticle={setOpenCreateArticle} setOpenCreateFlow={setOpenCreateFlow} />
      <TableProvider<PrintArticle>
        type={meta.name}
        columns={columns}
        initialState={{}}
      >
        <View.Content>
          <PrintArticleList columns={columns} />
        </View.Content>
      </TableProvider>

      <Dialog open={openCreateArticle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa artikel</DialogTitle>
            <DialogDescription>Skapa en ny artikel</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenCreateArticle(false)}>
              Avbryt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openCreateFlow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lista över flöden</DialogTitle>
          </DialogHeader>
          <PrintFlows />
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpenCreateFlow(false)}>
              Avbryt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View.Root>
  )
}

PrintArticles.meta = meta
