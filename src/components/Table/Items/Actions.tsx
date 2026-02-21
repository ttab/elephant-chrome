import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { Link } from '@/components'
import { useMemo } from 'react'
import type { JSX } from 'react'
import { useDocumentActivities } from '@/lib/documentActivity'

export const Actions = ({ deliverableUuids, planningId, docType }: {
  deliverableUuids: string[]
  planningId: string
  docType: string
}): JSX.Element => {
  const activities = useDocumentActivities(docType, planningId)

  return useMemo(() => {
    const items: DotDropdownMenuActionItem[] = [
      ...activities.map((activity) => ({
        label: activity.title,
        item: () => void activity.execute()
      })),
      {
        label: 'Assignments',
        emptyLabel: 'No deliverables',
        item: deliverableUuids.map((uuid) => ({
          label: uuid,
          item: (
            <Link to='Editor' props={{ id: uuid }}>
              {uuid}
            </Link>
          )
        }))
      }
    ]

    return <DotMenu items={items} />
  }, [deliverableUuids, activities])
}
