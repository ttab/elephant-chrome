import { type MouseEvent } from 'react'
import { Prompt } from '@/components'
import { useCollaboration } from '@/hooks/useCollaboration'
import {
  article as articleTpl,
  flash as flashTpl,
  type TemplatePayload
} from '@/defaults/templates/'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { toast } from 'sonner'

/**
 * Deliverable document creation dialog, responsible for creating articles and flashes in the repository.
 */
export function CreateDeliverablePrompt({ deliverableType, payload, onClose, title, documentLabel }: {
  deliverableType: string
  payload: TemplatePayload
  title: string
  documentLabel: string
  onClose: (
    event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent,
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
    await repository.saveDocument(
      (deliverableType === 'flash') ? flashTpl(id, payload) : articleTpl(id, payload),
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
      onPrimary={(event: MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement> | KeyboardEvent) => {
        onCreateDocument()
          .then((id) => {
            onClose(event, id)
          })
          .catch((ex) => {
            console.error((ex as Error).message)
            toast.error(`Misslyckades att skapa text: ${(ex as Error).message}`)
          })
      }}
      onSecondary={(event) => {
        onClose(event)
      }}
    />
  )
}
