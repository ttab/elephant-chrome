// import { useYObserver } from '@/hooks'
import { MessageCircleMore } from '@ttab/elephant-ui/icons'
// import { type Block } from '@/protos/service'
import { TextBox } from '@/components/ui'
import { AwarenessDocument } from '@/components'

export const PlanDescriptions = ({ documentId }: {
  documentId: string
}): JSX.Element => {
  return (
    <div className='flex flex-col gap-4 border border-2'>
      <AwarenessDocument documentId={documentId}>
        <PlanDescription role="public" name="publicDescription" />
      </AwarenessDocument>
      <PlanDescription role="internal" name="internalDescription" />
    </div>
  )
}

const PlanDescription = ({ role, name }: {
  role: string
  name: string
}): JSX.Element | undefined => {
  return (
    <div className='flex w-full' >
      <TextBox
        name={name}
        icon={role === 'internal' && <MessageCircleMore
          size={28}
          strokeWidth={1.75}
          className='pr-2 -mt-[0.12rem] text-muted-foreground'
        />}
        placeholder={role === 'public' ? 'Public description' : 'Internal message'}
      />
    </div>
  )
}
