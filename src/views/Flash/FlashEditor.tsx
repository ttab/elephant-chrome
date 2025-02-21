import { useCollaboration, useRegistry, useSupportedLanguages } from '@/hooks'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import Textbit, { type TBText } from '@ttab/textbit'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import { useEffect, useMemo } from 'react'
import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core'
import { createEditor } from 'slate'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import { Toolbar } from '@/components/Editor/Toolbar'
import { DropMarker } from '@/components/Editor/DropMarker'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { useSession } from 'next-auth/react'
import { Validation } from '@/components/Validation'
import type { FormProps } from '@/components/Form/Root'
import { getValueByYPath } from '@/lib/yUtils'


export const FlashEditor = ({ setTitle, onValidation, validateStateRef }: {
  setTitle: (value: string | undefined) => void
} & FormProps): JSX.Element => {
  const plugins = [UnorderedList, OrderedList, Bold, Italic, LocalizedQuotationMarks]
  const { provider, synced, user } = useCollaboration()

  return (
    <Validation
      label='Rubrik och innehåll'
      path='root.title'
      block='title'
      onValidation={onValidation}
      validateStateRef={validateStateRef}
    >
      <Textbit.Root
        plugins={[
          ...plugins.map((initPlugin) => initPlugin()),
          Text({ countCharacters: ['heading-1', 'body'] })
        ]}
        placeholders='multiple'
        className='w-full h-full rounded-md border'
      >
        {!!provider && synced
          ? <EditorContent provider={provider} user={user} setTitle={setTitle} />
          : <></>}
      </Textbit.Root>
    </Validation>
  )
}


function EditorContent({ provider, user, setTitle }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
  setTitle: (value: string | undefined) => void
}): JSX.Element {
  const { data: session } = useSession()
  const { spellchecker } = useRegistry()
  const supportedLanguages = useSupportedLanguages()
  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')

  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }
    const content = provider.document.getMap('ele').get('content') as YXmlText
    if (!content) {
      return
    }

    return withYHistory(
      withCursors(
        withYjs(
          createEditor(),
          content
        ),
        provider.awareness,
        { data: user as unknown as Record<string, unknown> }
      )
    )
  }, [provider, user])

  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return (
    <Textbit.Editable
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={async (texts) => {
        if (documentLanguage) {
          const spellingResult = await spellchecker?.check(texts.map(({ text }) => text), documentLanguage, supportedLanguages, session?.accessToken ?? '')
          if (spellingResult) {
            return spellingResult
          }
        }
        return []
      }}
      onChange={(value) => {
        // @ts-expect-error Textbit plugins needs to expose plugin types better
        const titleNode = value?.find((child) => child.class === 'text' && child?.properties?.role === 'heading-1')
        setTitle(extractText(titleNode as TBText))
      }}
      className='outline-none
        h-full
        min-h-[20vh]
        max-h-[40vh]
        overflow-y-scroll
        dark:text-slate-100
        px-2
        [&_[data-spelling-error]]:border-b-2
        [&_[data-spelling-error]]:border-dotted
        [&_[data-spelling-error]]:border-red-500
        '
    >
      <DropMarker />
      <Toolbar />
      <ContextMenu className='fooo z-[9999]' />
    </Textbit.Editable>
  )
}

/**
 * Recursively traverse the text nodes to extract the string
 */
function extractText(node?: TBText): string {
  if (!node) {
    return ''
  }

  if (Array.isArray(node.children)) {
    return node.children.map(extractText).join('')
  }

  return node?.text || ''
}
