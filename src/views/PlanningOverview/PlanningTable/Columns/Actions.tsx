import { ActionMenu } from '@/components/DataItem/ActionMenu'
import { useMemo } from 'react'

export const Actions = ({ deliverableUuids, planningId }: { deliverableUuids: string[], planningId: string }): JSX.Element => {
  return useMemo(() => (
    <ActionMenu deliverableUuids={deliverableUuids} planningId={planningId} />
  ), [deliverableUuids, planningId])
}
