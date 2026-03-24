import { useEffect, useRef } from 'react'
import { useEditor } from '@ttab/textbit'
import type * as Y from 'yjs'

interface YjsEditorLike {
  localOrigin: unknown
  isLocalOrigin: (origin: unknown) => boolean
  undoManager?: Y.UndoManager
}

function isYjsEditorLike(editor: unknown): editor is YjsEditorLike {
  return (
    typeof editor === 'object'
    && editor !== null
    && 'localOrigin' in editor
    && 'isLocalOrigin' in editor
  )
}

/**
 * Patches the current Slate-Yjs editor so that its transaction origin is
 * unique to this editor instance.
 *
 * Without this patch every editor created by @ttab/textbit shares a single
 * module-level Symbol (`DEFAULT_LOCAL_ORIGIN` from @slate-yjs/core).
 * When two editors in the same window are bound to the same Y.XmlText
 * (e.g. two views of the same document), each editor filters out the
 * other's changes because `isLocalOrigin(transaction.origin)` returns
 * true for both.
 *
 * Must be rendered as a child of `<Textbit.Root>`. React runs children's
 * effects before the parent's, so the patch is applied before the editor
 * connects to the Y.Doc.
 */
export function UniqueEditorOrigin(): null {
  const editor = useEditor()
  const patched = useRef(false)

  useEffect(() => {
    if (patched.current || !isYjsEditorLike(editor)) {
      return
    }

    const oldOrigin = editor.localOrigin
    const uniqueOrigin = Symbol('textbit-editor')

    editor.localOrigin = uniqueOrigin
    editor.isLocalOrigin = (origin: unknown) => origin === uniqueOrigin

    if (editor.undoManager) {
      editor.undoManager.trackedOrigins.delete(oldOrigin)
      editor.undoManager.trackedOrigins.add(uniqueOrigin)
    }

    patched.current = true
  }, [editor])

  return null
}
