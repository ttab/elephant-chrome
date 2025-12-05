import { View } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useMemo, useState, type JSX } from 'react'
import { printArticlesListColumns } from './PrintArticlesListColumns'
import { TableProvider } from '@/contexts/TableProvider'
import { PrintArticleList } from './PrintArticlesList'
import { type PrintArticle } from '@/hooks/baboon/lib/printArticles'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@ttab/elephant-ui'
import { PrintFlows } from './PrintFlows'
import { PrintArticlesHeader } from './PrintArticlesHeader'
import { useQuery } from '@/hooks/useQuery'
import { useInitFilters } from '@/hooks/useInitFilters'
import { useDocuments } from '@/hooks/index/useDocuments'
import type { PrintFlow, PrintFlowFields } from '@/shared/schemas/printFlow'
import { fields } from '@/shared/schemas/printFlow'

/**
 * Metadata for the PrintArticles view.
 *
 * This object defines the name, path, and responsive widths for the PrintArticles view.
 * It is used to configure the layout and routing of the view within the application.
 */

const meta: ViewMetadata = {
  name: 'Print',
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
 * @returns The rendered PrintArticles component.
 */

export const Print = (): JSX.Element => {
  const [query] = useQuery()

  const { data } = useDocuments<PrintFlow, PrintFlowFields>({
    documentType: 'tt/print-flow',
    fields
  })

  const columns = useMemo(
    () => printArticlesListColumns({ printFlows: data }),
    [data]
  )

  const columnFilters = useInitFilters<PrintArticle>({
    path: 'filters.Print.current',
    columns
  })

  const [openCreateFlow, setOpenCreateFlow] = useState(false)
  return (
    <View.Root>
      <PrintArticlesHeader />
      <TableProvider<PrintArticle>
        type={meta.name}
        columns={columns}
        initialState={{
          grouping: ['printFlow'],
          columnFilters,
          globalFilter: query.query
        }}
      >
        <View.Content>
          <PrintArticleList columns={columns} />
        </View.Content>
      </TableProvider>
      <Dialog open={openCreateFlow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lista över flöden</DialogTitle>
          </DialogHeader>
          <PrintFlows action='createFlow' />
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

Print.meta = meta
