import { View } from '@/components'
import type { ViewProps } from '@/types'
import { useAwareness, useCollaboration, useView, useYjsEditor } from '@/hooks'
import { Form } from '@/components/Form'
import { LocalizedQuotationMarks, Text } from '@ttab/textbit-plugins'
import Textbit, { Gutter, useTextbit } from '@ttab/textbit'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import type { AwarenessUserData } from '@/contexts/CollaborationProvider'
import { FlashHeader } from './FlashHeader'
import { useEffect, useRef } from 'react'
import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'

export const FlashView = (props: ViewProps): JSX.Element => {
  const { provider } = useCollaboration()

  if (!props.id || !provider?.synced) {
    return <></>
  }

  return (
    <View.Root className={props.className}>
      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          <FlashEditor documentId={props.id} />
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}


// Main editor wrapper after document initialization
function FlashEditor(props: ViewProps & {
  documentId: string
  planningId?: string | null
  autoFocus?: boolean
}): JSX.Element {
  const { provider, synced, user } = useCollaboration()
  const [, setIsFocused] = useAwareness(props.documentId)

  const plugins = [LocalizedQuotationMarks]

  return (
    <View.Root>
      <Textbit.Root
        plugins={[
          ...plugins.map((initPlugin) => initPlugin()),
          Text({ countCharacters: ['heading-1', 'body'] })
        ]}
        autoFocus={props.autoFocus ?? true}
        onBlur={() => {
          setIsFocused(false)
        }}
        onFocus={() => {
          setIsFocused(true)
        }}
        placeholders='multiple'
        className='h-screen max-h-screen flex flex-col'
      >
        <EditorContainer
          provider={provider}
          synced={synced}
          user={user}
          planningId={props.planningId}
          documentId={props.documentId}
        />
      </Textbit.Root>
    </View.Root>
  )
}

// Container component that uses TextBit context
function EditorContainer({
  provider,
  synced,
  user,
  documentId
}: {
  provider: HocuspocusProvider | undefined
  synced: boolean
  user: AwarenessUserData
  documentId: string
  planningId?: string | null
}): JSX.Element {
  const { words, characters } = useTextbit()

  return (
    <>
      <FlashHeader id={documentId} asDialog={false} />

      <View.Content className='flex flex-col max-w-[1000px]'>
        <div className='flex-grow overflow-auto max-w-screen-xl'>
          {!!provider && synced
            ? <EditorContent provider={provider} user={user} />
            : <></>}
        </div>
      </View.Content>

      <View.Footer>
        <div className='flex gap-2'>
          <strong>Ord:</strong>
          <span>{words}</span>
        </div>
        <div className='flex gap-2'>
          <strong>Tecken:</strong>
          <span>{characters}</span>
        </div>
      </View.Footer>
    </>
  )
}

function EditorContent({ provider, user }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
}): JSX.Element {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')

  const yjsEditor = useYjsEditor(provider, user)
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  // Handle focus on active state
  useEffect(() => {
    if (isActive && ref?.current?.dataset['state'] !== 'focused') {
      setTimeout(() => {
        ref?.current?.focus()
      }, 0)
    }
  }, [isActive, ref])

  return (
    <Textbit.Editable
      ref={ref}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={onSpellcheck}
      className='outline-none
        h-full
        dark:text-slate-100
        [&_[data-spelling-error]]:border-b-2
        [&_[data-spelling-error]]:border-dotted
        [&_[data-spelling-error]]:border-red-500
        px-[56px]
      '
    >
      <Gutter />
    </Textbit.Editable>
  )
}
