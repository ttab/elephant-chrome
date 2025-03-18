import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'

export const PromptDefault = ({ prompt, setStatus, showPrompt }: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
}) => {
  return (
    <Prompt
      title={prompt.title}
      description={prompt.description}
      primaryLabel={prompt.title}
      secondaryLabel='Avbryt'
      onPrimary={() => {
        showPrompt(undefined)
        void setStatus(prompt.status)
      }}
      onSecondary={() => {
        showPrompt(undefined)
      }}
    />
  )
}
