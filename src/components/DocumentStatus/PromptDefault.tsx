import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useCallback, useEffect, useState } from 'react'
import { PromptCauseField } from './PromptCauseField'
import { useTranslation } from 'react-i18next'
import { HastToggle } from '@/components/HastToggle'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

export const PromptDefault = ({
  prompt,
  setStatus,
  showPrompt,
  requireCause = false,
  currentCause,
  unPublishDocument,
  ydoc,
  usableId,
  documentType
}: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
  requireCause?: boolean
  currentCause?: string
  unPublishDocument?: (name: string) => Promise<void>
  ydoc?: YDocument<Y.Map<unknown>>
  usableId?: bigint
  documentType?: string
}) => {
  const [cause, setCause] = useState<string | undefined>(currentCause)
  const isUnpublishPrompt = prompt.status === 'unpublished'
  const { t } = useTranslation('common')

  const showCauseField = isUnpublishPrompt
    ? false
    : requireCause || cause
  const disablePrimary = isUnpublishPrompt
    ? false
    : requireCause && !cause

  useEffect(() => {
    if (prompt.status === 'draft') {
      setCause('')
    }
  }, [prompt.status])

  const handleSubmit = useCallback(() => {
    if (isUnpublishPrompt && unPublishDocument) {
      void unPublishDocument('unpublished')
    } else {
      void setStatus(prompt.status, { cause })
    }

    showPrompt(undefined)
  }, [cause, isUnpublishPrompt, prompt.status, setStatus, showPrompt, unPublishDocument])

  // Handle auto-submit when verification is not required
  useEffect(() => {
    if (prompt.verify === false) {
      handleSubmit()
    }
  }, [prompt.verify, handleSubmit])

  // Don't render the prompt if verification is not required
  if (prompt.verify === false) {
    return null
  }

  return (
    <Prompt
      title={prompt.title}
      description={prompt.description}
      primaryLabel={prompt.title}
      secondaryLabel={t('actions.abort')}
      onPrimary={handleSubmit}
      onSecondary={() => {
        showPrompt(undefined)
      }}
      disablePrimary={disablePrimary}
      primaryVariant={isUnpublishPrompt ? 'destructive' : undefined}
    >
      {ydoc?.ele && documentType === 'core/article' && prompt.status !== 'unpublished' && prompt.status !== 'draft' && (
        <HastToggle ydoc={ydoc} usableId={usableId} variant='full' />
      )}
      {(showCauseField) && (
        <PromptCauseField
          onValueChange={setCause}
          cause={prompt.status !== 'draft' ? cause : ''}
        />
      )}
    </Prompt>
  )
}
