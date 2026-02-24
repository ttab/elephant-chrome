import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { Link } from '@/components'
import { useMemo } from 'react'
import type { JSX } from 'react'

export const Actions = ({ deliverableUuids, planningId }: { deliverableUuids: string[], planningId: string }): JSX.Element => {
  return useMemo(() => {
    const items: DotDropdownMenuActionItem[] = [
      {
        label: 'Open',
        item: (
          <Link to='Planning' props={{ id: planningId }}>
            Open
          </Link>
        )
      },
      {
        label: 'Assignments',
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
  }, [deliverableUuids, planningId])
}
