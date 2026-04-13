import { Prompt } from '@/components'
import type { TemplatePayload } from '@/shared/templates/'
import { useSession } from 'next-auth/react'
import { useRegistry, useTimelessCategories } from '@/hooks'
import { toast } from 'sonner'
import { getTemplateFromDeliverable } from '@/shared/templates/lib/getTemplateFromDeliverable'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import type { JSX } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Block } from '@ttab/elephant-api/newsdoc'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'

/**
 * Deliverable document creation dialog, responsible for creating articles and flashes in the repository.
 */
export function CreateDeliverablePrompt({ ydoc, deliverableType, payload, onClose, title, documentLabel }: {
  ydoc: YDocument<Y.Map<unknown>>
  deliverableType: 'article' | 'flash' | 'editorial-info' | 'timeless'
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
  const [selectedCategory, setSelectedCategory] = useState<Block | undefined>()
  const allCategories = useTimelessCategories().map((cat) => ({
    value: cat.id,
    label: cat.title
  }))

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

    // Timeless articles require a category
    if (deliverableType === 'timeless' && !selectedCategory) {
      throw new Error(t('errors:toasts.missingTimelessCategory'))
    }

    // Add timeless category to payload if selected
    const finalPayload = { ...payload }
    if (deliverableType === 'timeless' && selectedCategory) {
      finalPayload.links = {
        ...finalPayload.links,
        'core/timeless-category': [selectedCategory]
      }
    }

    const id = crypto.randomUUID()
    const template = getTemplateFromDeliverable(deliverableType)
    await repository.saveDocument(
      template(id, finalPayload),
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
      disablePrimary={deliverableType === 'timeless' && !selectedCategory}
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
    >
      {deliverableType === 'timeless' && (
        <div className='flex flex-col gap-2'>
          <Label className='text-sm text-muted-foreground'>
            {t('views:timeless.columnLabels.category')}
          </Label>
          <Select
            value={selectedCategory?.uuid}
            onValueChange={(value) => {
              const cat = allCategories.find((c) => c.value === value)
              if (cat) {
                setSelectedCategory(Block.create({
                  type: 'core/timeless-category',
                  rel: 'subject',
                  uuid: cat.value,
                  title: cat.label
                }))
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('views:timeless.placeholders.addCategory')} />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </Prompt>
  )
}
