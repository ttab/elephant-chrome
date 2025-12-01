import { View } from '@/components'
import type { ViewProps } from '@/types'
import { useQuery, useView, useYjsEditor } from '@/hooks'
import { Form } from '@/components/Form'
import { LocalizedQuotationMarks, Text } from '@ttab/textbit-plugins'
import Textbit, { Gutter, useTextbit } from '@ttab/textbit'
import { FlashHeader } from './FlashHeader'
import { useEffect, useRef } from 'react'
import { getValueByYPath } from '@/shared/yUtils'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { useYDocument, type YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const FlashView = (props: {
  documentId: string
} & ViewProps): JSX.Element => {
  const [query] = useQuery()
  const readOnly = Number(props?.version) > 0 && !props.asDialog
  const preview = query.preview === 'true'

  const ydoc = useYDocument<Y.Map<unknown>>(props.documentId, {
    visibility: !preview
  })

  if (!props.id || !ydoc.provider?.isSynced) {
    return <></>
  }

  return (
    <View.Root className={props.className}>
      <View.Content>
        <Form.Root asDialog={props.asDialog}>
          <FlashEditor ydoc={ydoc} readOnly={readOnly} preview={preview} planningId={props.planningId} />
        </Form.Root>
      </View.Content>
    </View.Root>
  )
}


// Main editor wrapper after document initialization
function FlashEditor({ ydoc, ...props }: ViewProps & {
  ydoc: YDocument<Y.Map<unknown>>
  planningId?: string | null
  autoFocus?: boolean
  version?: string
  readOnly?: boolean
  preview?: boolean
}): JSX.Element {
  const plugins = [LocalizedQuotationMarks]

  return (
    <View.Root>
      <Textbit.Root
        plugins={[
          ...plugins.map((initPlugin) => initPlugin()),
          Text({
            countCharacters: ['heading-1', 'body'],
            preventHotkeys: ['heading-1', 'heading-2', 'preamble']
          })
        ]}
        autoFocus={props.autoFocus ?? true}
        placeholders='multiple'
        className='h-screen max-h-screen flex flex-col'
      >
        <EditorContainer
          ydoc={ydoc}
          planningId={props.planningId}
          readOnly={props?.readOnly}
          preview={props.preview}
        />
      </Textbit.Root>
    </View.Root>
  )
}

// Container component that uses TextBit context
function EditorContainer({
  ydoc,
  readOnly,
  preview,
  planningId
}: {
  ydoc: YDocument<Y.Map<unknown>>
  planningId?: string | null
  readOnly?: boolean
  preview?: boolean
}): JSX.Element {
  const { stats } = useTextbit()

  return (
    <>
      <FlashHeader ydoc={ydoc} asDialog={false} readOnly={readOnly} preview={preview} planningId={planningId} />

      <View.Content className='flex flex-col max-w-[1000px]'>
        <div className='grow overflow-auto max-w-(--breakpoint-xl)'>
          {!!ydoc.provider && ydoc.provider.isSynced
            ? <EditorContent ydoc={ydoc} readOnly={readOnly} preview={preview} />
            : <></>}
        </div>
      </View.Content>

      <View.Footer>
        <div className='flex gap-2'>
          <strong>Ord:</strong>
          <span title='Antal ord totalt'>{stats.full.words}</span>
        </div>
        <div className='flex gap-2'>
          <strong>Tecken:</strong>
          <span title='Antal tecken totalt'>{stats.full.characters}</span>
        </div>
      </View.Footer>
    </>
  )
}

function EditorContent({ ydoc, readOnly, preview }: {
  ydoc: YDocument<Y.Map<unknown>>
  readOnly?: boolean
  preview?: boolean
}): JSX.Element {
  const { isActive } = useView()
  const ref = useRef<HTMLDivElement>(null)
  const [documentLanguage] = getValueByYPath<string>(ydoc.ele, 'root.language')

  const yjsEditor = useYjsEditor(ydoc)
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
      readOnly={readOnly || preview}
      ref={ref}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={onSpellcheck}
      className='outline-none
        h-full
        dark:text-slate-100
        **:data-spelling-error:border-b-2
        **:data-spelling-error:border-dotted
        **:data-spelling-error:border-red-500
        px-[56px]
      '
    >
      <Gutter />
    </Textbit.Editable>
  )
}
