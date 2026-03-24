import { ActionMenu } from '@/components/DataItem/ActionMenu'
import { useMemo } from 'react'
import type { JSX } from 'react'

export const Actions = ({ deliverableUuids, planningId, docType }: {
  deliverableUuids: string[]
  planningId: string
  docType: string
}): JSX.Element => {
  return useMemo(() => (
    <ActionMenu deliverableUuids={deliverableUuids} planningId={planningId} docType={docType} />
  ), [deliverableUuids, planningId, docType])
}
