import { ActionMenu } from '@/components/DataItem/ActionMenu'
import { useMemo } from 'react'

export const Actions = ({ deliverableUuids, eventId }: { deliverableUuids: string[], eventId: string }): JSX.Element => {
  return useMemo(() => (
    <ActionMenu deliverableUuids={deliverableUuids} planningId={eventId} />
  ), [deliverableUuids, eventId])
}
