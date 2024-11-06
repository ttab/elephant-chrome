import { useCollaboration, useRegistry } from '@/hooks'
import { Bold, Italic, Text, OrderedList, UnorderedList } from '@ttab/textbit-plugins'
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


export const FlashEditor = ({ setTitle }: {
  setTitle: (value: string | undefined) => void
}): JSX.Element => {
  const plugins = [Text, UnorderedList, OrderedList, Bold, Italic]
  const { provider, synced, user } = useCollaboration()

  return (
    <Textbit.Root
      plugins={plugins.map(initPlugin => initPlugin())}
      placeholders="multiple"
      className="border-y"
    >
      {!!provider && synced
        ? <EditorContent provider={provider} user={user} setTitle={setTitle} />
        : <></>
      }
    </Textbit.Root>
  )
}


function EditorContent({ provider, user, setTitle }: {
  provider: HocuspocusProvider
  user: AwarenessUserData
  setTitle: (value: string | undefined) => void
}): JSX.Element {
  const { data: session } = useSession()
  const { spellchecker, locale } = useRegistry()

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
    <div className='w-full px-6'>
      <Textbit.Editable
        yjsEditor={yjsEditor}
        onSpellcheck={async (texts) => {
          return await spellchecker?.check(texts, locale, session?.accessToken ?? '') ?? []
        }}
        onChange={(value) => {
          // @ts-expect-error Textbit plugins needs to expose plugin types better
          const titleNode = value?.find(child => child.class === 'text' && child?.properties?.role === 'heading-1')
          setTitle(extractText(titleNode as TBText))
        }}
        className="outline-none
        h-full min-h-[20vh]
        max-h-[40vh]
        overflow-y-scroll
        dark:text-slate-100
        py-5
        [&_[data-spelling-error]]:border-b-2
        [&_[data-spelling-error]]:border-dotted
        [&_[data-spelling-error]]:border-red-500
        "
      >
        <DropMarker />
        <Toolbar />
        <ContextMenu className='fooo z-[9999]' />
      </Textbit.Editable>
    </div>
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
