import { Prompt } from '@/components'
import type { TemplatePayload } from '@/shared/templates/'
import { useSession } from 'next-auth/react'
import { useRegistry } from '@/hooks/useRegistry'
import { toast } from 'sonner'
import { getTemplateFromDeliverable } from '@/shared/templates/lib/getTemplateFromDeliverable'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import type { JSX } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

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
  const [isCreating, setIsCreating] = useState(false)
  const { t } = useTranslation()

  if (!ydoc.provider?.document || !session?.accessToken || !repository) {
    console.error('CreateDeliverablePrompt: Missing required dependencies', {
      hasDocument: !!ydoc.provider?.document,
      hasAccessToken: !!session?.accessToken,
      hasRepository: !!repository
    })
    toast.error(t('errors:messages.createDeliverableError'))
    return <></>
  }

  const onCreateDocument = async () => {
    // Validate payload contains required fields
    if (!payload.meta?.['core/newsvalue'] || !payload.links?.['core/section']) {
      throw new Error(t('errors:toasts.missingMetadata'))
    }

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
      title={`${t('common:actions.create')} ${documentLabel}?`}
      description={t('planning:prompts.createPrompt', {
        documentLabel,
        title: title ? ' ' + title : ''
      })}
      secondaryLabel={t('common:actions.abort')}
      primaryLabel={t('common:actions.create')}
      onPrimary={() => {
        if (isCreating) {
          return
        }

        setIsCreating(true)
        onCreateDocument()
          .then((id) => {
            onClose(id)
          })
          .catch((ex) => {
            const errorMessage = ex instanceof Error ? ex.message : t('errors:messages.unknown')
            console.error('Failed to create deliverable:', errorMessage, ex)
            toast.error(t('errors:toasts.creationFailed', { error: errorMessage }))
            setIsCreating(false)
          })
      }}
      onSecondary={() => {
        onClose()
      }}
    />
  )
}
