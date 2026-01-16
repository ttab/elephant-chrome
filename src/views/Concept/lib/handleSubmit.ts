import { snapshotDocument } from '@/lib/snapshotDocument'
import type { YDocument } from '@/modules/yjs/hooks'
import { toast } from 'sonner'
import type * as Y from 'yjs'

export const handleSubmit = (
  ydoc: YDocument<Y.Map<unknown>>,
  onDialogClose: ((id?: string, title?: string) => void) | undefined): void => {
  snapshotDocument(ydoc.id, { status: 'usable', addToHistory: true }, ydoc.provider?.document)
    .then(() => {
      onDialogClose?.(ydoc.id)
    }).catch((ex) => {
      console.error('Failed to snapshot document', ex)
      toast.error('Kunde inte skapa ny inställning!', {
        duration: 5000,
        position: 'top-center'
      })
    }).finally(() => {
      if (!ydoc) {
        return
      }
      ydoc.setIsChanged(false)
      if (onDialogClose) {
        onDialogClose()
      }
    })
}
