import {
  getStatusSpecifications,
  type StatusSpecification,
  type WorkflowTransition
} from '@/defaults/workflowSpecification'
import { StatusMenuOption } from './StatusMenuOption'
import type { PropsWithChildren } from 'react'

export const StatusOptions = ({ transitions, statuses, onSelect, children, hasChanges, documentType }: {
  transitions: Record<string, WorkflowTransition>
  statuses: Record<string, StatusSpecification>
  onSelect: (state: { status: string } & WorkflowTransition) => void
  hasChanges?: boolean
  documentType: string | undefined
} & PropsWithChildren) => {
  return (
    <div className='p-2'>
      {children}
      {Object.entries(transitions)
        .filter(([status]) => {
          // Filter out configured transitions not allowed according to
          // information fetched from repository.
          return !!(status === 'draft' || status === 'unpublished' || statuses[status])
        })
        .map(([status, state]) => {
          const statusDef = status === 'unpublished' ? getStatusSpecifications(status, documentType) : statuses[status]
          return (
            <StatusMenuOption
              key={status}
              status={status}
              statusDef={statusDef}
              state={state}
              onSelect={onSelect}
              hasChanges={hasChanges}
            />
          )
        })}
    </div>
  )
}
