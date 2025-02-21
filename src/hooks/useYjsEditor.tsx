import { useMemo, useEffect } from 'react'
import { createEditor } from 'slate'
import { YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { type YXmlText } from 'node_modules/yjs/dist/src/internals'
import { type HocuspocusProvider } from '@hocuspocus/provider'
import { type AwarenessUserData } from '@/contexts/CollaborationProvider'

/**
 * Hook for creating and managing a YJS-enabled Textbit editor
 */
export function useYjsEditor(
  provider: HocuspocusProvider | undefined,
  user: AwarenessUserData
) {
  // Create YJS editor with cursors and history
  const yjsEditor = useMemo(() => {
    if (!provider?.awareness) {
      return undefined
    }

    const content = provider.document.getMap('ele').get('content') as YXmlText

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
  }, [provider?.awareness, provider?.document, user])

  // Connect/disconnect from provider
  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return yjsEditor
}
