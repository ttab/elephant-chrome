import { Prompt } from '@/components'
import { useCollaboration } from '@/hooks/useCollaboration'
import {
  type TemplatePayload
} from '@/defaults/templates/'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { toast } from 'sonner'
import { getTemplateFromDeliverable } from '@/defaults/templates/lib/getTemplateFromDeliverable'

/**
 * Deliverable document creation dialog, responsible for creating articles and flashes in the repository.
 */
export function CreateDeliverablePrompt({ deliverableType, payload, onClose, title, documentLabel }: {
  deliverableType: 'article' | 'flash' | 'editorial-info'
  payload: TemplatePayload
  title: string
  documentLabel: string
  onClose: (
    id?: string
  ) => void
}): JSX.Element {
  const { repository } = useRegistry()
  const { provider } = useCollaboration()
  const { data: session } = useSession()

  if (!provider?.document || !session?.accessToken || !repository) {
    return <></>
  }

  const onCreateDocument = async () => {
    const id = crypto.randomUUID()
    const template = getTemplateFromDeliverable(deliverableType)
    await repository.saveDocument(
      template(id, payload),
      session.accessToken,
      BigInt(-1)
    )

    return id
  }

  return (
    <Prompt
      title={`Skapa ${documentLabel}?`}
      description={`Vill du skapa en ${documentLabel} för uppdraget${title ? ' ' + title : ''}?`}
      secondaryLabel='Avbryt'
      primaryLabel='Skapa'
      onPrimary={() => {
        onCreateDocument()
          .then((id) => {
            onClose(id)
          })
          .catch((ex) => {
            console.error((ex as Error).message)
            toast.error(`Misslyckades att skapa text: ${(ex as Error).message}`)
          })
      }}
      onSecondary={() => {
        onClose()
      }}
    />
  )
}
