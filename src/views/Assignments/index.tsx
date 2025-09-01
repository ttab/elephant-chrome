import { useMemo, useState } from 'react'
import { View, ViewHeader } from '@/components'
import { TabsContent } from '@ttab/elephant-ui'
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
import { type IDBAuthor } from 'src/datastore/types'
import { useQuery } from '@/hooks/useQuery'
import { newLocalDate } from '@/shared/datetime'
import { loadFilters } from '@/lib/loadFilters'
import { useSections } from '@/hooks/useSections'
import type { Assignment } from '@/shared/schemas/assignments'

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
  const [query] = useQuery()
  const [currentTab, setCurrentTab] = useState<string>('list')
  const authors = useAuthors()
  const { locale, timeZone } = useRegistry()
  const { data: session } = useSession()
  const sections = useSections()

  const assigneeId = useMemo(() => {
    const userSub = session?.user?.sub
    const subId = userSub?.slice(userSub?.lastIndexOf('/') + 1)
    const author = authors?.find((a: IDBAuthor) => {
      return a.sub.slice(a?.sub.lastIndexOf('/') + 1) === subId
    })

    return author?.id
  }, [authors, session?.user?.sub])

  const date = useMemo(() => {
    return (typeof query.from === 'string')
      ? newLocalDate(timeZone, { date: query.from })
      : newLocalDate(timeZone)
  }, [query.from, timeZone])


  const columns = useMemo(() =>
    assignmentColumns({ authors, locale, timeZone, sections, currentDate: date }), [authors, locale, timeZone, sections, date])
  const columnFilters = loadFilters<Assignment>(query, columns)

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<Assignment>
        type={meta.name}
        columns={columns}
        initialState={{
          grouping: ['startTime'],
          columnFilters,
          sorting: [
            { id: 'startTime', desc: false },
            { id: 'assignment_time', desc: false }
          ],
          globalFilter: query.query
        }}
      >
        <TableCommandMenu heading='Assignments'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name={meta.name} title='Uppdrag' />
            <Header type={meta.name} assigneeId={assigneeId} />
          </ViewHeader.Content>

          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <AssignmentsList date={date} columns={columns} />
          </TabsContent>
        </View.Content>

      </TableProvider>
    </View.Root>
  )
}

Assignments.meta = meta
