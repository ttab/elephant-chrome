import { Textbit } from '@ttab/textbit'
import { createEditor } from 'slate'
import { cn } from '@ttab/elephant-ui/utils'
import { useLayoutEffect, useMemo } from 'react'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'
import type * as Y from 'yjs'
import { ContextMenu } from '../../Editor/ContextMenu'
import { useOnSpellcheck } from '@/hooks/useOnSpellcheck'
import { getValueByYPath } from '@/shared/yUtils'

export const TextboxEditable = ({ provider, path, user, content, singleLine, spellcheck, disabled = false, onChange }: {
  disabled?: boolean
  provider: HocuspocusProvider
  path: string
  singleLine: boolean
  user: AwarenessUserData
  content: Y.XmlText
  spellcheck?: boolean
  onChange?: (arg: boolean) => void
}): JSX.Element | undefined => {
  const [documentLanguage] = getValueByYPath<string>(provider.document.getMap('ele'), 'root.language')
  const onSpellcheck = useOnSpellcheck(documentLanguage)

  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return
    }

    return withYHistory(
      withCursors(
        withYjs(createEditor(), content),
        provider.awareness,
        {
          autoSend: false,
          data: user as unknown as Record<string, unknown>,
          cursorStateField: path
        }
      )
    )
  }, [provider?.awareness, user, path, content])

  useLayoutEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return (
    <Textbit.Editable
      onChange={() => {
        if (provider.hasUnsyncedChanges) {
          onChange?.(true)
        }
      }}
      readOnly={disabled}
      yjsEditor={yjsEditor}
      lang={documentLanguage}
      onSpellcheck={spellcheck ? onSpellcheck : undefined}
      className={cn(!singleLine && '!min-h-20',
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
        [&_[data-spelling-error]]:border-b-2
        [&_[data-spelling-error]]:border-dotted
        [&_[data-spelling-error]]:border-red-500
        dark:bg-input`
      )}
    >
      <ContextMenu className='z-[9999]' />
    </Textbit.Editable>
  )
}
