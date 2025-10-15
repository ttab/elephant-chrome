import { Textbit } from '@ttab/textbit'
import { createEditor } from 'slate'
import { cn } from '@ttab/elephant-ui/utils'
import { useLayoutEffect, useMemo } from 'react'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import type * as Y from 'yjs'
import { ContextMenu } from '../../Editor/ContextMenu'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { useYPath, useYValue, type YDocument } from '@/modules/yjs/hooks'

export const TextboxEditable = ({ value, ydoc, singleLine, spellcheck, disabled = false }: {
  value: Y.XmlText
  ydoc: YDocument<Y.Map<unknown>>
  disabled?: boolean
  singleLine: boolean
  spellcheck?: boolean
}): JSX.Element | undefined => {
  const path = useYPath(value, true)
  const [documentLanguage] = useYValue<string>(ydoc.ele, ['root', 'language'])
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  const yjsEditor = useMemo(() => {
    return (!ydoc.provider?.awareness || !ydoc.user)
      ? undefined
      : withYHistory(
        withCursors(
          withYjs(createEditor(), value),
          ydoc.provider.awareness,
          {
            autoSend: false,
            data: ydoc.user ?? undefined,
            cursorStateField: path
          }
        )
      )
  }, [value, path, ydoc.user, ydoc.provider?.awareness])

  useLayoutEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  if (!yjsEditor) return

  return (
    <Textbit.Editable
      readOnly={disabled}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={spellcheck ? onSpellcheck : undefined}
      className={cn(!singleLine && 'min-h-20!',
        `p-1
        py-1.5
        ps-2
        rounded-md
        outline-none
        ring-offset-background
        focus:ring-1
        ring-input
        focus:dark:ring-gray-600
        whitespace-nowrap
        **:data-spelling-error:border-b-2
        **:data-spelling-error:border-dotted
        **:data-spelling-error:border-red-500
        dark:bg-input`
      )}
    >
      <ContextMenu className='z-9999' />
    </Textbit.Editable>
  )
}
