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
import { type AssignmentMeta } from './types'
import { type IDBAuthor } from 'src/datastore/types'
import { useQuery } from '@/hooks/useQuery'
import { getDateTimeBoundariesUTC } from '@/lib/datetime'

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
  const { from } = useMemo(() =>
    getDateTimeBoundariesUTC(typeof query.from === 'string'
      ? new Date(`${query.from}T00:00:00.000Z`)
      : new Date()),
  [query.from])
  const [currentTab, setCurrentTab] = useState<string>('list')
  const authors = useAuthors()
  const { locale, timeZone } = useRegistry()
  const { data: session } = useSession()

  const assigneeUserName = useMemo(() => {
    const userSub = session?.user?.sub
    const subId = userSub?.slice(userSub?.lastIndexOf('/') + 1)
    const author = authors?.find((a: IDBAuthor) => {
      return a.sub.slice(a?.sub.lastIndexOf('/') + 1) === subId
    })

    return author?.name
  }, [authors, session?.user?.sub])

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<AssignmentMeta & { planningTitle: string, newsvalue: string, _id: string }>
        columns={assignmentColumns({ authors, locale, timeZone })}
      >
        <TableCommandMenu heading='Assignments'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Title name='Assignments' title='Uppdrag' />
          <ViewHeader.Content>
            <Header
              type='Assignments'
              assigneeUserName={assigneeUserName}
            />
          </ViewHeader.Content>
          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <AssignmentsList startDate={from} />
          </TabsContent>
        </View.Content>

      </TableProvider>
    </View.Root>
  )
}

Assignments.meta = meta
