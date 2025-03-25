import { type MouseEvent } from 'react'
import { createPayload } from '@/defaults/templates/lib/createPayload'
import { Prompt } from '@/components'
import { createDocument } from '@/lib/createYItem'
import { useCollaboration } from '@/hooks/useCollaboration'
import { articleDocumentTemplate } from '@/defaults/templates/articleDocumentTemplate'
import { useSession } from 'next-auth/react'
import { fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc'
import { fromGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { useRegistry } from '@/hooks/useRegistry'

/**
 * Document creation dialog, responsible for creating articles and flashes in the repository.
 *
 * TODO: Display information that will be forwarded from the assignment
 */
export function CreateDeliverablePrompt({ index, onClose, title, documentLabel }: {
  index: number
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
    // Create the document
    const payload = createPayload(provider.document, index)
    const [id, doc] = createDocument({
      template: (id: string) => {
        return articleDocumentTemplate(id, payload)
      }
    })

    // Save document to repository
    const { documentResponse } = fromYjsNewsDoc(doc)
    const { document } = fromGroupedNewsDoc(documentResponse)
    await repository.saveDocument(document, session.accessToken, BigInt(-1))

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
            alert(`Misslyckades att skapa text: ${(ex as Error).message}`)
          })
      }}
      onSecondary={(event) => {
        onClose(event)
      }}
    />
  )
}
