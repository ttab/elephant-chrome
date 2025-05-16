import {
  type StatusSpecification,
  type WorkflowTransition,
  StatusSpecifications
} from '@/defaults/workflowSpecification'
import { StatusMenuOption } from './StatusMenuOption'
import type { PropsWithChildren } from 'react'

export const StatusOptions = ({ transitions, statuses, onSelect, children }: {
  transitions: Record<string, WorkflowTransition>
  statuses: Record<string, StatusSpecification>
  onSelect: (state: { status: string } & WorkflowTransition) => void
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
          const statusDef = status === 'unpublished' ? StatusSpecifications[status] : statuses[status]
          return (
            <StatusMenuOption
              key={status}
              status={status}
              statusDef={statusDef}
              state={state}
              onSelect={onSelect}
            />
          )
        })}
    </div>
  )
}
