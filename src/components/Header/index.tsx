import { DateChanger } from '@/components/Header/Datechanger'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { type View } from '@/types/index'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'
import { useMemo, type JSX } from 'react'
import { AddButtonGroup } from './AddButtonGroup'

export const Header = ({ assigneeId, type }: {
  type: View
  assigneeId?: string | undefined
}): JSX.Element => {
  const showButton = useMemo(() => {
    const viewTypes: View[] = ['Planning', 'Event', 'Factbox']
    if (viewTypes.includes(type)) {
      return true
    }
    return false
  }, [type])

  return (
    <>
      {showButton && (
        <AddButtonGroup type={type} />
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
