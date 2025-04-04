import { View, ViewHeader } from '@/components/View'
import { DateChanger } from '@/components/Header/Datechanger'
import { type ViewMetadata } from '@/types/index'
import { useMemo, useState } from 'react'
import { printArticlesListColumns } from './PrintArticlesListColumns'
import { TableProvider } from '@/contexts/TableProvider'
import { PrintArticleList } from './PrintArticlesList'
import type { PrintArticle } from '@/hooks/index/lib/printArticles'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@ttab/elephant-ui'
import { CirclePlus } from '@ttab/elephant-ui/icons'
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

  const columns = useMemo(
    () => printArticlesListColumns({ locale: 'sv' }),
    []
  )

  const [openCreateFlow, setOpenCreateFlow] = useState(false)

  return (
    <View.Root>
      <ViewHeader.Root className='flex flex-row gap-2 items-center justify-between'>
        <div className='flex flex-row gap-4 items-center justify-start'>
          <ViewHeader.Title title='Print' name='PrintArticles' />
          <DateChanger type='PrintArticles' />
        </div>
        <div className='flex flex-row gap-2 items-center justify-end'>
          <Popover>
            <PopoverTrigger>
              <Button title='Skapa ny...' variant='outline'>
                <CirclePlus strokeWidth={1.75} size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='flex flex-col gap-2'>
              <Button title='Skapa en text i ett flöde' variant='outline'>
                Ny artikel
              </Button>
              <Button
                title='Öppna dialogruta för att välja ett flöde. Artiklarna för flödet kommer sedan att skapas av backend enligt definitionen i flödet.'
                variant='outline'
                onClick={() => setOpenCreateFlow(true)}
              >
                Nytt flöde
              </Button>
            </PopoverContent>
          </Popover>
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
