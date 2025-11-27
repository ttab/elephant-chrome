import { useRegistry, useSupportedLanguages } from '@/hooks'
import { Bold, Italic, Text, OrderedList, UnorderedList, LocalizedQuotationMarks } from '@ttab/textbit-plugins'
import Textbit, { type TBText } from '@ttab/textbit'
import { useEffect, useMemo } from 'react'
import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core'
import { createEditor } from 'slate'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import { Toolbar } from '@/components/Editor/Toolbar'
import { DropMarker } from '@/components/Editor/DropMarker'
import { ContextMenu } from '@/components/Editor/ContextMenu'
import { Validation } from '@/components/Validation'
import type { FormProps } from '@/components/Form/Root'
import { getValueByYPath } from '@/shared/yUtils'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const FlashEditor = ({ ydoc, setTitle, onValidation, validateStateRef, readOnly }: {
  ydoc: YDocument<Y.Map<unknown>>
  setTitle: (value: string | undefined) => void
  readOnly?: boolean
} & FormProps): JSX.Element => {
  const plugins = [UnorderedList, OrderedList, Bold, Italic, LocalizedQuotationMarks]

  return (
    <Validation
      ydoc={ydoc}
      label='Rubrik och innehåll'
      path='root.title'
      block='title'
      onValidation={onValidation}
      validateStateRef={validateStateRef}
    >
      <Textbit.Root
        plugins={[
          ...plugins.map((initPlugin) => initPlugin()),
          Text({
            countCharacters: ['heading-1', 'body'],
            preventHotkeys: ['heading-1', 'heading-2', 'preamble']
          })
        ]}
        placeholders='multiple'
        className='w-full h-full rounded-md border'
      >
        {!!ydoc.provider && ydoc.provider.isSynced
          ? <EditorContent ydoc={ydoc} setTitle={setTitle} readOnly={readOnly} />
          : <></>}
      </Textbit.Root>
    </Validation>
  )
}


function EditorContent({ ydoc, setTitle, readOnly }: {
  ydoc: YDocument<Y.Map<unknown>>
  setTitle: (value: string | undefined) => void
  readOnly?: boolean
}): JSX.Element {
  const { spellchecker } = useRegistry()
  const supportedLanguages = useSupportedLanguages()
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')

  const yjsEditor = useMemo(() => {
    if (!ydoc.provider?.awareness) {
      return
    }
    const content = ydoc.ele.get('content') as YXmlText
    if (!content) {
      return
    }

    return withYHistory(
      withCursors(
        withYjs(
          createEditor(),
          content
        ),
        ydoc.provider.awareness,
        { data: ydoc.user ?? undefined }
      )
    )
  }, [ydoc])

  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return (
    <Textbit.Editable
      readOnly={readOnly}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={async (texts) => {
        if (documentLanguage) {
          const spellingResult = await spellchecker?.check(texts.map(({ text }) => text), documentLanguage, supportedLanguages)
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
        **:data-spelling-error:border-b-2
        **:data-spelling-error:border-dotted
        **:data-spelling-error:border-red-500
        '
    >
      <DropMarker />
      <Toolbar />
      <ContextMenu className='fooo z-9999' />
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
