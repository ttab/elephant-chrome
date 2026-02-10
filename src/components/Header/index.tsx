import { DateChanger } from '@/components/Header/Datechanger'
import { TabsGrid } from '@/components/Header/LayoutSwitch'
import { type View } from '@/types/index'
import { PersonalAssignmentsFilter } from './PersonalAssignmentsFilter'
import { useMemo, type JSX } from 'react'
import { AddButtonGroup } from './AddButtonGroup'
import { useQuery } from '@/hooks/useQuery'
import { useTranslation } from 'react-i18next'

export const Header = ({ assigneeId, type, docType }: {
  type: View
  assigneeId?: string | undefined
  docType?: string
}): JSX.Element => {
  const [query] = useQuery()
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
        <AddButtonGroup type={type} docType={docType} query={query} />
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
