import { useEffect, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader } from '@/components'
import { BriefcaseBusinessIcon } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/components/Header'
import { type Planning } from '@/lib/index/schemas/planning'
import { AssignmentsList } from './AssignmentsList'
import { assignmentColumns } from './AssignmentColumns'
import { useAuthors } from '@/hooks/useAuthors'
import { Commands } from '@/components/Commands'

const meta: ViewMetadata = {
  name: 'Assignments',
  path: `${import.meta.env.BASE_URL}/assignments`,
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

export const Assignments = (): JSX.Element => {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(getEndDate(startDate))
  const [currentTab, setCurrentTab] = useState<string>('list')
  const authors = useAuthors()

  useEffect(() => {
    setEndDate(getEndDate(startDate))
  }, [startDate])

  return (
    <TableProvider<Planning> columns={assignmentColumns({ authors })}>
      <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>
        <TableCommandMenu>
          <Commands />
        </TableCommandMenu>
        <div className="flex flex-col h-screen">
          <ViewHeader.Root>
            <ViewHeader.Title title="Uppdrag" short="Uppdrag" icon={BriefcaseBusinessIcon} iconColor='#006bb3' />
            <ViewHeader.Content>
              <Header
                tab={currentTab}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                type='Assignments'
              />
            </ViewHeader.Content>

            <ViewHeader.Action />
          </ViewHeader.Root>

          <ScrollArea>
            <TabsContent value='list' className='mt-0'>
              <AssignmentsList date={startDate} />
            </TabsContent>

            <TabsContent value='grid'>
              {/* <AssignmentGrid startDate={startDate} endDate={endDate} /> */}
            </TabsContent>
          </ScrollArea>
        </div>

      </Tabs>
    </TableProvider>
  )
}

Assignments.meta = meta

function getEndDate(startDate: Date): Date {
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 6)
  return endDate
}
