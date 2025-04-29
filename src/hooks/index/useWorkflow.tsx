import { useRegistry } from '../useRegistry'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  type WorkflowSpecification,
  type StatusSpecification,
  StatusSpecifications,
  WorkflowSpecifications
} from '@/defaults/workflowSpecification'

interface DocumentWorkflow {
  workflow: WorkflowSpecification
  statuses: Record<string, StatusSpecification>
}

export const useWorkflow = (type: string): DocumentWorkflow => {
  const { data: session } = useSession()
  const { workflow: client } = useRegistry()
  const [workflow, setWorkflow] = useState<DocumentWorkflow>({
    statuses: {},
    workflow: {}
  })

  useEffect(() => {
    if (!client || !session?.accessToken) {
      return
    }

    client.getStatuses({
      type,
      accessToken: session.accessToken || ''
    }).then((wfStatuses) => {
      // Filter out all status specifications based on statuses allowed for this type
      // Draft is always included here as it is not specified in the backend.
      const statuses = (wfStatuses || []).reduce((acc, wfStatus) => {
        if (StatusSpecifications[wfStatus.name]) {
          acc[wfStatus.name] = StatusSpecifications[wfStatus.name]
        }

        return acc
      }, { draft: StatusSpecifications['draft'] } as Record<string, StatusSpecification>)
      console.log('statuses', statuses)
      setWorkflow({
        workflow: WorkflowSpecifications[type] || null,
        statuses
      })
    }).catch((err: Error) => {
      console.error(err.message || 'Failed getting workflow specification')
    })
  }, [client, session?.accessToken, type])

  return workflow
}
