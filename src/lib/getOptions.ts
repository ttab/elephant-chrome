import { StatusSpecifications, WorkflowSpecifications } from '@/defaults/workflowSpecification'
import type { DefaultValueOption } from '../types'

/**
 * Create an array of options based on configured statuses for a specific document type.
 */
export function getOptions(type: string) {
  const workflow = WorkflowSpecifications[type]
  if (!workflow) {
    return []
  }

  const options: DefaultValueOption[] = []

  Object.keys(workflow).map((status) => {
    const state = workflow[status]

    options.push({
      label: state.title,
      value: status,
      icon: StatusSpecifications[status].icon,
      iconProps: {
        className: StatusSpecifications[status].className || '',
        size: 18,
        strokeWidth: 1.75
      }
    })
  })

  return options
}
