import { useMemo, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader } from '@/components'
import { CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'

import { PlanningList } from './PlanningList'
import { TableProvider } from '@/contexts/TableProvider'

import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/views/PlanningOverview/PlanningHeader'
import { PlanningCommands } from './PlanningCommands'
import { planningTableColumns } from './PlanningListColumns'
import { type Planning as PlanningType, Plannings as PlanningsIndex } from '@/lib/index'
import { useSections } from '@/hooks/useSections'
import { useAuthors } from '@/hooks/useAuthors'
import { SWRProvider } from '@/contexts/SWRProvider'
import { getDateTimeBoundariesUTC } from '@/lib/datetime'
import { useQuery } from '@/hooks/useQuery'

const meta: ViewMetadata = {
  name: 'Plannings',
  path: `${import.meta.env.BASE_URL}/plannings`,
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

export const Plannings = (): JSX.Element => {
  const query = useQuery()
  const { from, to } = useMemo(() =>
    getDateTimeBoundariesUTC(query.from
      ? new Date(`${query.from}T00:00:00.000Z`)
      : new Date()),
  [query.from])

  const [currentTab, setCurrentTab] = useState<string>('list')
  const sections = useSections()
  const authors = useAuthors()

  const columns = useMemo(() => planningTableColumns({ sections, authors }), [sections, authors])

  return (
    <TableProvider<PlanningType> columns={columns}>
      <SWRProvider<PlanningType> index={PlanningsIndex}>
        <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

          <TableCommandMenu>
            <PlanningCommands />
          </TableCommandMenu>

          <div className="flex flex-col h-screen">
            <ViewHeader.Root>
              <ViewHeader.Title
                title="Planeringar"
                short="Planeringar"
                icon={CalendarDaysIcon}
                iconColor='#FF971E'
              />

              <ViewHeader.Content>
                <Header
                  tab={currentTab}
                />
              </ViewHeader.Content>

              <ViewHeader.Action />
            </ViewHeader.Root>

            <ScrollArea>
              <TabsContent value='list' className='mt-0'>
                <PlanningList from={from} to={to} />
              </TabsContent>

              <TabsContent value='grid'>
              </TabsContent>
            </ScrollArea>
          </div>

        </Tabs>
      </SWRProvider>
    </TableProvider>
  )
}

Plannings.meta = meta
