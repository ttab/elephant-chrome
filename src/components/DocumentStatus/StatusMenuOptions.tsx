import type { StatusSpecification, WorkflowTransition } from '@/defaults/workflowSpecification'
import { StatusMenuOption } from './StatusMenuOption'

export const StatusOptions = ({ transitions, statuses, onSelect }: {
  transitions: Record<string, WorkflowTransition>
  statuses: Record<string, StatusSpecification>
  onSelect: (state: { status: string } & WorkflowTransition) => void
}) => {
  return (
    <div className='p-2'>
      {Object.entries(transitions)
        .filter(([status]) => {
          // Filter out configured transitions not allowed according to
          // information fetched from repository.
          return !!(status === 'draft' || statuses[status])
        })
        .map(([status, state]) => {
          const statusDef = statuses[status]
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
