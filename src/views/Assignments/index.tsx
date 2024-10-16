import { useEffect, useMemo, useState } from 'react'
import { ViewHeader } from '@/components'
import { BriefcaseBusinessIcon } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/components/Header'
import { AssignmentsList } from './AssignmentsList'
import { assignmentColumns } from './AssignmentColumns'
import { Commands } from '@/components/Commands'
import { useAuthors } from '@/hooks/useAuthors'
import { useRegistry } from '@/hooks/useRegistry'
import { useSession } from 'next-auth/react'
import { type ViewMetadata } from '@/types'
import { type AssignmentMeta } from './types'
import { type IDBAuthor } from 'src/datastore/types'

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
  const { locale, timeZone } = useRegistry()
  const { data: session } = useSession()

  const assigneeUserName = useMemo(() => {
    const userEmail = session?.user.email
    const author = authors.find((_: IDBAuthor) => _?.email === userEmail)
    return author?.name
  }, [authors, session?.user?.email])

  useEffect(() => {
    setEndDate(getEndDate(startDate))
  }, [startDate])

  return (
    <TableProvider<AssignmentMeta & { planningTitle: string, newsvalue: string }>
      columns={assignmentColumns({ authors, locale, timeZone })}
    >
      <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>
        <TableCommandMenu heading='Assignments'>
          <Commands />
        </TableCommandMenu>
        <div className="flex flex-col h-screen">
          <ViewHeader.Root>
            <ViewHeader.Title
              title="Uppdrag"
              short="Uppdrag"
              iconColor='#006bb3'
              icon={BriefcaseBusinessIcon}
            />
            <ViewHeader.Content>
              <Header
                tab={currentTab}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                type='Assignments'
                assigneeUserName={assigneeUserName}
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
