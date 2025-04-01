import type { WorkflowTransition } from '@/defaults/workflowSpecification'
import { Prompt } from '../Prompt'
import { useState } from 'react'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ttab/elephant-ui'

export const PromptDefault = ({ prompt, setStatus, showPrompt, requireCause = false }: {
  prompt: {
    status: string
  } & WorkflowTransition
  setStatus: (status: string, data: Record<string, unknown>) => void
  showPrompt: React.Dispatch<React.SetStateAction<({
    status: string
  } & WorkflowTransition) | undefined>>
  requireCause?: boolean
}) => {
  const [cause, setCause] = useState<string | undefined>()

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
      {requireCause && (
        <div className='flex flex-col gap-2'>
          <Label htmlFor='ScheduledTime'>Anledning</Label>
          <Select onValueChange={setCause}>
            <SelectTrigger>
              <SelectValue placeholder='Välj anledning...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='UV'>UV</SelectItem>
              <SelectItem value='KORR'>KORR</SelectItem>
              <SelectItem value='RÄ'>RÄ</SelectItem>
              <SelectItem value='OMS'>OMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </Prompt>
  )
}
