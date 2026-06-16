import { useRegistry } from '../useRegistry'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  type WorkflowSpecification,
  type StatusSpecification,
  getStatusSpecifications,
  getWorkflowSpecifications
} from '@/defaults/workflowSpecification'

interface DocumentWorkflow {
  workflow: WorkflowSpecification
  statuses: Record<string, StatusSpecification>
}

export const useWorkflow = (type?: string): DocumentWorkflow => {
  const { data: session } = useSession()
  const { workflow: client } = useRegistry()
  const [workflow, setWorkflow] = useState<DocumentWorkflow>({
    statuses: {},
    workflow: {}
  })

  useEffect(() => {
    if (!client || !session?.accessToken || !type) {
      return
    }

    client.getStatuses({
      type,
      accessToken: session.accessToken || ''
    }).then((wfStatuses) => {
      // Filter out all status specifications based on statuses allowed for this type
      // Draft is always included here as it is not specified in the backend.
      const statuses = (wfStatuses || []).reduce((acc, wfStatus) => {
        if (getStatusSpecifications(wfStatus.name, type)) {
          acc[wfStatus.name] = getStatusSpecifications(wfStatus.name, type)
        }

        return acc
      }, { draft: getStatusSpecifications('draft') } as Record<string, StatusSpecification>)
      setWorkflow({
        workflow: getWorkflowSpecifications()[type] || null,
        statuses
      })
    }).catch((err: Error) => {
      console.error(err.message || 'Failed getting workflow specification')
    })
  }, [client, session?.accessToken, type])

  return workflow
}
