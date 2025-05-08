import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useState } from 'react'
import { PromptCauseField } from './PromptCauseField'

export const PromptDefault = ({ prompt, setStatus, showPrompt, requireCause = false, currentCause }: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
  requireCause?: boolean
  currentCause?: string
}) => {
  const [cause, setCause] = useState<string | undefined>(currentCause)

  return (
    <Prompt
      title={prompt.title}
      description={prompt.description}
      primaryLabel={prompt.title}
      secondaryLabel='Avbryt'
      onPrimary={() => {
        showPrompt(undefined)
        void setStatus(prompt.status, { cause })
      }}
      onSecondary={() => {
        showPrompt(undefined)
      }}
      disablePrimary={requireCause && !cause}
    >
      {(cause || requireCause) && (
        <PromptCauseField
          onValueChange={setCause}
          cause={prompt.status !== 'draft' ? cause : ''}
        />
      )}
    </Prompt>
  )
}
