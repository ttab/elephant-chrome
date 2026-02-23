import { DateChanger } from '@/components/Header/Datechanger'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { type View, type BuiltinView } from '@/types/index'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'
import { useMemo, type JSX } from 'react'
import { AddButtonGroup } from './AddButtonGroup'
import { useQuery } from '@/hooks/useQuery'

export const Header = ({ assigneeId, type, docType }: {
  type: View
  assigneeId?: string | undefined
  docType?: string
}): JSX.Element => {
  const [query] = useQuery()
  const showButton = useMemo(() => {
    const viewTypes: BuiltinView[] = ['Planning', 'Event', 'Factbox', 'Approvals', 'Assignments']
    if ((viewTypes as View[]).includes(type)) {
      return true
    }
    return false
  }, [type])

  return (
    <>
      {showButton && (
        <AddButtonGroup type={type as BuiltinView} docType={docType} query={query} />
      )}

      <div className='hidden sm:block'>
        <TabsGrid />
      </div>

      <DateChanger type={type} />

      {type === 'Assignments'
        && <PersonalAssignmentsFilter assigneeId={assigneeId} />}
    </>
  )
}
