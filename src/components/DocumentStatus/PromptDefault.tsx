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
  currentCause?: string | undefined
}) => {
  const [cause, setCause] = useState<string | undefined>(currentCause)

  return (
    <Prompt
      title={prompt.title}
      description={prompt.description}
      primaryLabel={prompt.title}
      currentCause={{ cause: currentCause, setCause }}
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
      {requireCause && !currentCause && (
        <div className='flex flex-col gap-2'>
          <PromptCauseField onValueChange={setCause} />
        </div>
      )}
    </Prompt>
  )
}
