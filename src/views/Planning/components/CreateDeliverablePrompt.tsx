import { Prompt } from '@/components'
import type { TemplatePayload } from '@/shared/templates/'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { toast } from 'sonner'
import { getTemplateFromDeliverable } from '@/shared/templates/lib/getTemplateFromDeliverable'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

/**
 * Deliverable document creation dialog, responsible for creating articles and flashes in the repository.
 */
export function CreateDeliverablePrompt({ ydoc, deliverableType, payload, onClose, title, documentLabel }: {
  ydoc: YDocument<Y.Map<unknown>>
  deliverableType: 'article' | 'flash' | 'editorial-info'
  payload: TemplatePayload
  title: string
  documentLabel: string
  onClose: (
    id?: string
  ) => void
}): JSX.Element {
  const { repository } = useRegistry()
  const { data: session } = useSession()

  if (!ydoc.provider?.document || !session?.accessToken || !repository) {
    return <></>
  }

  const onCreateDocument = async () => {
    const id = crypto.randomUUID()
    const template = getTemplateFromDeliverable(deliverableType)
    await repository.saveDocument(
      template(id, payload),
      session.accessToken
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
