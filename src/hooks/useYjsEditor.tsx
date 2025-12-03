import { useMemo, useEffect } from 'react'
import { createEditor } from 'slate'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
/**
 * Hook for creating and managing a YJS-enabled Textbit editor
 * FIXME: This should be removed completely after refactoring
 * @deprecated Built into textbit
 */
export function useYjsEditor(
  ydoc: YDocument<Y.Map<unknown>>
) {
  // Create YJS editor with cursors and history
  const yjsEditor = useMemo(() => {
    if (!ydoc.provider?.awareness) {
      console.warn('No provider awareness found')
      return undefined
    }

    const content = ydoc.ele.get('content') as YXmlText

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

  // Connect/disconnect from provider
  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return yjsEditor
}
