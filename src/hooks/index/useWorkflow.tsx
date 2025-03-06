import { useRegistry } from '../useRegistry'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import type { DocumentWorkflow } from '@ttab/elephant-api/repository'
import type { DefaultValueOption } from '@/types'

interface WorkflowSpecification {
  workflow: DocumentWorkflow | null
  statuses: DefaultValueOption[]
}

export const useWorkflow = (type: string): WorkflowSpecification | null => {
  const { data: session } = useSession()
  const { workflow: client } = useRegistry()
  const [workflow, setWorkflow] = useState<WorkflowSpecification | null>(null)

  useEffect(() => {
    if (!client || !session?.accessToken) {
      return
    }

    client.getWorkflow({
      type,
      accessToken: session.accessToken || ''
    }).then((wf) => {
      setWorkflow({
        workflow: wf?.workflow || null,
        statuses: DocumentStatuses.filter((status) => wf?.statuses.find((s) => s.name === status.value))
      })
    }).catch((err: Error) => {
      console.error(err.message || 'Failed getting workflow specification')
    })
  }, [client, session?.accessToken, type])
  return workflow
}
